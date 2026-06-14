#!/usr/bin/env python3
"""
LDraw → Catalog Geometry Baker

Liest alle Parts aus brick/ldraw/parts/*.dat, löst rekursiv alle Primitiv-
und Sub-Part-Referenzen auf, und schreibt für jeden Part:
  - brick/catalog/geo/{id}.json  — { positions: [...], indices: [...] }
  - brick/catalog/index.json     — Katalog-Index mit LOD-Level pro Part

LOD-Zuweisung nach Triangle-Anzahl (automatisch, manuell überschreibbar):
  1 = Proxy    (< 50 Tris  oder fehlendes LDraw)
  2 = Mid      (50–499 Tris)
  3 = Full     (≥ 500 Tris)

Override-Datei: brick/catalog/lod_overrides.json → { "3001": 2, ... }
"""

import json, math, os, re, struct, sys
from pathlib import Path

ROOT   = Path(__file__).parent.parent
LDRAW  = ROOT / 'ldraw'
OUT    = ROOT / 'catalog'
GEO    = OUT / 'geo'
DATA   = ROOT / 'data' / 'parts.json'
OVERRIDES_FILE = OUT / 'lod_overrides.json'

GEO.mkdir(parents=True, exist_ok=True)

# ── Matrix helpers ────────────────────────────────────────────────────────────

def identity():
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]

def mat_mul(a, b):
    """4×4 matrix multiply (row-major flat list)."""
    r = [0]*16
    for i in range(4):
        for j in range(4):
            for k in range(4):
                r[i*4+j] += a[i*4+k] * b[k*4+j]
    return r

def mat_apply(m, x, y, z):
    """Transform point (x,y,z,1) by 4×4 matrix m."""
    nx = m[0]*x + m[1]*y + m[2]*z + m[3]
    ny = m[4]*x + m[5]*y + m[6]*z + m[7]
    nz = m[8]*x + m[9]*y + m[10]*z + m[11]
    return nx, ny, nz

def mat_determinant3(m):
    """3×3 determinant of upper-left corner of 4×4 matrix (for winding check)."""
    return (m[0]*(m[5]*m[10] - m[6]*m[9])
           -m[1]*(m[4]*m[10] - m[6]*m[8])
           +m[2]*(m[4]*m[9]  - m[5]*m[8]))

# ── LDraw parser ──────────────────────────────────────────────────────────────

SEARCH_DIRS = [
    LDRAW / 'parts',
    LDRAW / 'parts' / 's',
    LDRAW / 'p',
]

def find_dat(name):
    """Find a .dat file by (possibly path-prefixed) name."""
    name_clean = name.replace('\\', '/').lower()
    # direct name
    base = Path(name_clean).name
    sub  = Path(name_clean).parent.name  # 's' or ''

    for d in SEARCH_DIRS:
        candidate = d / base
        if candidate.exists():
            return candidate
        # also try with subdir prefix
        if sub == 's':
            candidate2 = LDRAW / 'parts' / 's' / base
            if candidate2.exists():
                return candidate2
    return None

def parse_matrix_line(parts):
    """Parse line-type-1 fields: color x y z a b c d e f g h i filename"""
    # parts[0] = '1', parts[1] = color, parts[2..4] = x y z,
    # parts[5..13] = 3×3 rotation, parts[14] = filename
    x,y,z = float(parts[2]), float(parts[3]), float(parts[4])
    a,b,c = float(parts[5]),  float(parts[6]),  float(parts[7])
    d,e,f = float(parts[8]),  float(parts[9]),  float(parts[10])
    g,h,i_ = float(parts[11]), float(parts[12]), float(parts[13])
    filename = ' '.join(parts[14:])

    m = [
        a, b, c, x,
        d, e, f, y,
        g, h, i_,z,
        0, 0, 0, 1,
    ]
    return m, filename

def collect_triangles(path, matrix=None, visited=None, invert=False):
    """Recursively parse an LDraw file, return list of (v0,v1,v2) tuples."""
    if matrix is None:
        matrix = identity()
    if visited is None:
        visited = set()

    path = Path(path)
    key = str(path).lower()
    if key in visited:
        return []
    visited = visited | {key}

    try:
        text = path.read_text(errors='replace')
    except Exception:
        return []

    triangles = []
    invert_next = False    # gilt NUR fürs unmittelbar folgende Sub-File (LDraw-Spec)
    winding_cw  = False    # BFC-Zertifizierung dieses Files (Default CCW)

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith('0'):
            # Meta/BFC-Kommandos
            toks = line.split()
            if 'BFC' in toks:
                if 'INVERTNEXT' in toks:
                    invert_next = True
                if 'CW' in toks:
                    winding_cw = True
                elif 'CCW' in toks:
                    winding_cw = False
            continue

        parts_l = line.split()
        ltype = parts_l[0]

        if ltype == '1':
            # Sub-file reference — INVERTNEXT + negative Determinante wirken hier
            if len(parts_l) < 15:
                invert_next = False
                continue
            local_m, fname = parse_matrix_line(parts_l)
            combined = mat_mul(matrix, local_m)
            sub_invert = invert ^ invert_next
            if mat_determinant3(local_m) < 0:
                sub_invert = not sub_invert
            invert_next = False  # Einmal-Flag verbraucht

            sub_path = find_dat(fname)
            if sub_path:
                sub_tris = collect_triangles(sub_path, combined, visited, sub_invert)
                triangles.extend(sub_tris)

        elif ltype == '3':
            # Triangle — Winding = akkumulierter Invert XOR File-CW-Zertifizierung
            invert_next = False
            if len(parts_l) < 11:
                continue
            v0 = mat_apply(matrix, float(parts_l[2]), float(parts_l[3]), float(parts_l[4]))
            v1 = mat_apply(matrix, float(parts_l[5]), float(parts_l[6]), float(parts_l[7]))
            v2 = mat_apply(matrix, float(parts_l[8]), float(parts_l[9]), float(parts_l[10]))
            if invert ^ winding_cw:
                triangles.append((v0, v2, v1))
            else:
                triangles.append((v0, v1, v2))

        elif ltype == '4':
            # Quad → 2 triangles
            invert_next = False
            if len(parts_l) < 14:
                continue
            v0 = mat_apply(matrix, float(parts_l[2]),  float(parts_l[3]),  float(parts_l[4]))
            v1 = mat_apply(matrix, float(parts_l[5]),  float(parts_l[6]),  float(parts_l[7]))
            v2 = mat_apply(matrix, float(parts_l[8]),  float(parts_l[9]),  float(parts_l[10]))
            v3 = mat_apply(matrix, float(parts_l[11]), float(parts_l[12]), float(parts_l[13]))
            if invert ^ winding_cw:
                triangles.append((v0, v2, v1))
                triangles.append((v0, v3, v2))
            else:
                triangles.append((v0, v1, v2))
                triangles.append((v0, v2, v3))
        else:
            invert_next = False  # type 2/5 (Linien) heben ein offenes INVERTNEXT auf

    return triangles

# ── Geometry output ───────────────────────────────────────────────────────────

def triangles_to_indexed(tris):
    """Deduplicate vertices, return positions list + index list."""
    vmap = {}
    positions = []
    indices = []
    for tri in tris:
        for v in tri:
            # Round to avoid float dust
            key = (round(v[0],4), round(v[1],4), round(v[2],4))
            if key not in vmap:
                vmap[key] = len(positions) // 3
                positions.extend(key)
            indices.append(vmap[key])
    return positions, indices

def compute_bbox(positions):
    if not positions:
        return [0,0,0,0,0,0]
    xs = positions[0::3]
    ys = positions[1::3]
    zs = positions[2::3]
    return [min(xs), min(ys), min(zs), max(xs), max(ys), max(zs)]

# ── LOD assignment ────────────────────────────────────────────────────────────

def auto_lod(tri_count):
    if tri_count < 50:
        return 1
    if tri_count < 500:
        return 2
    return 3

# ── Grouping ─────────────────────────────────────────────────────────────────
# Druck/Deko-Varianten teilen eine Gussform. Token 'pr####' oder 'mia'/'mib'
# abstreifen, aber Form-Buchstaben (a/b/c) und Assembly-Codes (c01) behalten.
PRINT_SUFFIX = re.compile(r'(pr\d+|mi[ab])$')

def group_key(pid):
    return PRINT_SUFFIX.sub('', pid)

# ── Main ─────────────────────────────────────────────────────────────────────

def load_parts_index():
    with open(DATA) as f:
        data = json.load(f)
    # Collect all unique parts across categories
    parts_by_id = {}
    for cat in data['categories']:
        for p in cat['parts']:
            pid = p['id']
            if pid not in parts_by_id:
                parts_by_id[pid] = {**p, 'cat_id': cat['id'], 'cat_label': cat['label']}
    return data['categories'], parts_by_id

def load_overrides():
    if OVERRIDES_FILE.exists():
        with open(OVERRIDES_FILE) as f:
            return json.load(f)
    return {}

def bake_part(pid, force=False):
    geo_path = GEO / f'{pid}.json'
    if geo_path.exists() and not force:
        # Read existing for metadata
        with open(geo_path) as f:
            existing = json.load(f)
        return existing.get('triCount', 0), True

    dat = LDRAW / 'parts' / f'{pid}.dat'
    if not dat.exists():
        return 0, False

    tris = collect_triangles(dat)
    if not tris:
        # Write empty placeholder so we know it was tried
        geo_path.write_text(json.dumps({'partId': pid, 'triCount': 0, 'positions': [], 'indices': [], 'bbox': [0,0,0,0,0,0]}))
        return 0, True

    positions, indices = triangles_to_indexed(tris)
    bbox = compute_bbox(positions)
    tri_count = len(tris)

    geo_data = {
        'partId': pid,
        'triCount': tri_count,
        'bbox': [round(v, 2) for v in bbox],
        'positions': [round(v, 3) for v in positions],
        'indices': indices,
    }
    geo_path.write_text(json.dumps(geo_data, separators=(',', ':')))
    return tri_count, True


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Bake LDraw parts to catalog geometry')
    parser.add_argument('--force', action='store_true', help='Re-bake existing files')
    parser.add_argument('--parts', nargs='*', help='Bake only these part IDs')
    args = parser.parse_args()

    categories, parts_by_id = load_parts_index()
    overrides = load_overrides()

    target_ids = args.parts if args.parts else sorted(parts_by_id.keys())

    print(f'Baking {len(target_ids)} parts ...')
    catalog_parts = []
    done = skip = fail = 0

    for i, pid in enumerate(target_ids):
        tri_count, has_ldraw = bake_part(pid, force=args.force)

        part_info = parts_by_id.get(pid, {'id': pid, 'name': pid, 'w': 1, 'd': 1, 'type': 'brick'})
        lod = overrides.get(pid, auto_lod(tri_count) if has_ldraw else 1)

        catalog_parts.append({
            'id': pid,
            'name': part_info.get('name', ''),
            'w': part_info.get('w', 1),
            'd': part_info.get('d', 1),
            'type': part_info.get('type', 'brick'),
            'catId': part_info.get('cat_id', 0),
            'catLabel': part_info.get('cat_label', ''),
            'hasLDraw': has_ldraw,
            'triCount': tri_count,
            'lod': lod,
            'group': group_key(pid),
        })

        if has_ldraw:
            done += 1
        else:
            fail += 1

        if (i + 1) % 100 == 0 or (i + 1) == len(target_ids):
            print(f'  {i+1}/{len(target_ids)}  baked={done}  no-ldraw={fail}')

    # Write catalog index
    catalog = {
        'generated': __import__('datetime').date.today().isoformat(),
        'totalParts': len(catalog_parts),
        'categories': [
            {'id': c['id'], 'label': c['label'], 'type': c['type']}
            for c in categories
        ],
        'parts': catalog_parts,
    }
    index_path = OUT / 'index.json'
    index_path.write_text(json.dumps(catalog, separators=(',', ':')))
    print(f'\n✓ catalog/index.json  ({len(catalog_parts)} parts)')
    print(f'✓ catalog/geo/        ({done} baked, {fail} missing LDraw)')

    # LOD stats
    lod_counts = {1: 0, 2: 0, 3: 0}
    for p in catalog_parts:
        lod_counts[p['lod']] = lod_counts.get(p['lod'], 0) + 1
    print(f'\nLOD distribution:')
    print(f'  LOD 1 (Proxy):  {lod_counts[1]}')
    print(f'  LOD 2 (Mid):    {lod_counts[2]}')
    print(f'  LOD 3 (Full):   {lod_counts[3]}')

if __name__ == '__main__':
    main()
