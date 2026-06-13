#!/usr/bin/env python3
"""
Fehlende LDraw-Parts aus mehreren Quellen nachladen.

Quellen-Reihenfolge pro Part:
  1. gkjohnson unofficial mirror (parts/)
  2. ldraw.org official  (parts/)
  3. ldraw.org unofficial (parts/)
  4. Fallback: Basis-Part (pr-/Buchstaben-Suffix entfernt) → unter Original-ID gespeichert

Danach: alle neu referenzierten Primitive (p/) und Sub-Parts (parts/s/) nachladen.
Ausgabe: brick/ldraw/  (ergänzt bestehende Dateien)
"""

import json, re, time, urllib.request, urllib.error
from pathlib import Path

ROOT  = Path(__file__).parent.parent
LDRAW = ROOT / 'ldraw'
DATA  = ROOT / 'data' / 'parts.json'

SOURCES = [
    'https://cdn.jsdelivr.net/gh/gkjohnson/ldraw-parts-library@master/complete/ldraw/',
    'https://library.ldraw.org/library/official/',
    'https://library.ldraw.org/library/unofficial/',
]

def http_get(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'brick-catalog/1.0'})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read()
    except urllib.error.HTTPError:
        return None
    except Exception as e:
        print(f'    err {url}: {e}')
        return None

def fetch_to(rel_path, dest):
    """Try each source for rel_path (e.g. 'parts/3001.dat'). Return source idx or None."""
    if dest.exists():
        return -1  # already have
    for i, base in enumerate(SOURCES):
        data = http_get(base + rel_path)
        if data:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            return i
        time.sleep(0.03)
    return None

def base_id(pid):
    """Strip print/variant suffix: 10202pr0016 → 10202, 30359b → 30359, 45403c01 → 45403."""
    m = re.match(r'^(\d+)', pid)
    return m.group(1) if m else None

PRINT_SUFFIX = re.compile(r'(pr\d+|mi[ab])$')

def group_key(pid):
    return PRINT_SUFFIX.sub('', pid)

def group_representatives_missing():
    """Ein Repräsentant pro Form-Gruppe (Druckvarianten gebündelt), der noch
    keine .dat-Datei hat. So bekommt jede distinkte Form ein eigenes Modell –
    nicht nur eine pro (w,d)-Maß."""
    data = json.load(open(DATA))
    groups = {}
    for cat in data['categories']:
        for p in cat['parts']:
            groups.setdefault(group_key(p['id']), []).append(p['id'])
    have = {f.stem for f in (LDRAW / 'parts').glob('*.dat')}
    targets = set()
    for key, ids in groups.items():
        # Schon ein Member mit .dat? Dann reicht das für die Gruppe.
        if any(i in have for i in ids):
            continue
        # Repräsentant: Basis-Part (== key) bevorzugt, sonst erstes Member
        targets.add(key if key in ids else ids[0])
    return sorted(targets)

# ── 1. Parts holen ────────────────────────────────────────────────────────────
missing = group_representatives_missing()
print(f'{len(missing)} fehlende Parts ...\n')

direct = fallback = stillmissing = 0
src_count = {0: 0, 1: 0, 2: 0}

for pid in missing:
    dest = LDRAW / 'parts' / f'{pid}.dat'
    idx = fetch_to(f'parts/{pid}.dat', dest)
    if idx is not None and idx >= 0:
        direct += 1
        src_count[idx] = src_count.get(idx, 0) + 1
        continue
    # Fallback: base part geometry under original id
    bid = base_id(pid)
    if bid and bid != pid:
        bdest = LDRAW / 'parts' / f'{bid}.dat'
        bidx = fetch_to(f'parts/{bid}.dat', bdest) if not bdest.exists() else -1
        if bdest.exists():
            # copy base geometry to the printed-part id
            dest.write_bytes(bdest.read_bytes())
            fallback += 1
            continue
    stillmissing += 1
    print(f'  ✗ {pid}')

print(f'\nDirekt geladen: {direct}  (gkjohnson:{src_count[0]} official:{src_count[1]} unofficial:{src_count[2]})')
print(f'Basis-Fallback: {fallback}')
print(f'Weiterhin fehlend: {stillmissing}')

# ── 2. Neue Referenzen (Primitive + Sub-Parts) auflösen ───────────────────────
print('\nLöse neue Primitiv-/Sub-Part-Referenzen auf ...')

def collect_refs(globs):
    refs = set()
    for dat in globs:
        try:
            for line in dat.read_text(errors='ignore').splitlines():
                pl = line.strip().split()
                if pl and pl[0] == '1' and len(pl) >= 15:
                    refs.add(' '.join(pl[14:]).replace('\\', '/').lower())
        except Exception:
            pass
    return refs

new_p = new_s = 0
for _ in range(5):  # iterate until closure
    added = 0
    refs = collect_refs(list((LDRAW / 'parts').glob('*.dat')) +
                        list((LDRAW / 'parts' / 's').glob('*.dat')) +
                        list((LDRAW / 'p').glob('*.dat')))
    for ref in sorted(refs):
        name = Path(ref).name
        is_sub = ref.startswith('s/') or '/s/' in ref
        if is_sub:
            dest = LDRAW / 'parts' / 's' / name
            rel = f'parts/s/{name}'
        else:
            dest = LDRAW / 'p' / name
            rel = f'p/{name}'
        if dest.exists():
            continue
        idx = fetch_to(rel, dest)
        if idx is not None and idx >= 0:
            added += 1
            if is_sub: new_s += 1
            else: new_p += 1
    if added == 0:
        break
    print(f'  +{added} neue Bausteine')

print(f'\nNeue Primitive (p/): {new_p}')
print(f'Neue Sub-Parts (s/): {new_s}')

# ── Zusammenfassung ───────────────────────────────────────────────────────────
total_parts = len(list((LDRAW / 'parts').glob('*.dat')))
print(f'\n=== ldraw/parts/ jetzt: {total_parts} Dateien ===')
