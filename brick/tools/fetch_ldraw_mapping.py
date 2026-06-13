#!/usr/bin/env python3
"""
Fehlende 3D-Modelle über das Rebrickable→LDraw External-ID-Mapping nachladen.

Problem: Rebrickable-Teilenummern ≠ LDraw-Teilenummern. Für Teile, die wir per
Rebrickable-ID nicht in LDraw finden, fragen wir die Rebrickable-API nach
`external_ids.LDraw` und laden die .dat unter dieser LDraw-Nummer — speichern sie
aber unter der Rebrickable-ID, damit der Katalog sie findet.

Key: siehe Vault / Memory (rebrickable-api-key). NICHT committen.
Aufruf:  REBRICKABLE_KEY=... python3 tools/fetch_ldraw_mapping.py
"""

import json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT  = Path(__file__).parent.parent
LDRAW = ROOT / 'ldraw'
INDEX = ROOT / 'catalog' / 'index.json'

KEY = os.environ.get('REBRICKABLE_KEY', '').strip()
if not KEY:
    sys.exit('Bitte REBRICKABLE_KEY setzen (Env-Var).')

API = 'https://rebrickable.com/api/v3/lego/parts/{}/?key=' + KEY
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
    except Exception:
        return None

def fetch_to(rel_path, dest):
    if dest.exists():
        return -1
    for base in SOURCES:
        data = http_get(base + rel_path)
        if data:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            return 1
        time.sleep(0.03)
    return None

PRINT_SUFFIX = re.compile(r'(pr\d+|mi[ab])$')
def group_key(pid):
    return PRINT_SUFFIX.sub('', pid)

# ── Fehlende Form-Gruppen ermitteln ───────────────────────────────────────────
d = json.load(open(INDEX))
groups = {}
for p in d['parts']:
    groups.setdefault(p.get('group', p['id']), []).append(p)

missing_reps = []
for key, members in groups.items():
    if any(p['hasLDraw'] for p in members):
        continue
    rep = next((p for p in members if p['id'] == key), members[0])
    missing_reps.append(rep['id'])

print(f'{len(missing_reps)} fehlende Form-Gruppen — frage Rebrickable-API ab ...\n')

# ── API-Lookup + Download ─────────────────────────────────────────────────────
ldraw_found = 0     # Teile mit LDraw-Mapping
dat_loaded = 0      # tatsächlich geladene .dat
only_bl = 0
no_ext = 0
loaded_ids = []

for i, rb_id in enumerate(missing_reps):
    data = http_get(API.format(rb_id))
    if not data:
        time.sleep(0.6)
        continue
    try:
        j = json.loads(data)
    except Exception:
        continue
    ext = j.get('external_ids', {})
    ldraw_ids = ext.get('LDraw') or []

    if not ldraw_ids:
        if ext.get('BrickLink'):
            only_bl += 1
        else:
            no_ext += 1
    else:
        ldraw_found += 1
        # .dat unter LDraw-Nummer holen → speichern unter Rebrickable-ID
        dest = LDRAW / 'parts' / f'{rb_id}.dat'
        got = False
        for ld in ldraw_ids:
            tmp = LDRAW / 'parts' / f'{ld}.dat'
            if fetch_to(f'parts/{ld}.dat', tmp) is not None:
                # unter beiden Namen verfügbar machen
                if not dest.exists():
                    dest.write_bytes(tmp.read_bytes())
                got = True
                break
        if got:
            dat_loaded += 1
            loaded_ids.append(rb_id)

    if (i + 1) % 25 == 0:
        print(f'  {i+1}/{len(missing_reps)}  LDraw-Mapping={ldraw_found}  geladen={dat_loaded}')
    time.sleep(0.5)  # Rate-Limit

print(f'\n--- Rebrickable-Lookup ---')
print(f'mit LDraw-Mapping:  {ldraw_found}')
print(f'.dat geladen:       {dat_loaded}')
print(f'nur BrickLink:      {only_bl}')
print(f'keine External-IDs: {no_ext}')
print(f'\nGeladene IDs: {" ".join(loaded_ids)}')

# ── Neue Primitive/Sub-Parts auflösen ─────────────────────────────────────────
if dat_loaded:
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

    for _ in range(5):
        added = 0
        refs = collect_refs(list((LDRAW / 'parts').glob('*.dat')) +
                            list((LDRAW / 'parts' / 's').glob('*.dat')) +
                            list((LDRAW / 'p').glob('*.dat')))
        for ref in sorted(refs):
            name = Path(ref).name
            is_sub = ref.startswith('s/') or '/s/' in ref
            dest = (LDRAW / 'parts' / 's' / name) if is_sub else (LDRAW / 'p' / name)
            rel = f'parts/s/{name}' if is_sub else f'p/{name}'
            if dest.exists():
                continue
            if fetch_to(rel, dest) is not None:
                added += 1
        if added == 0:
            break
        print(f'  +{added} neue Bausteine')

print(f'\n=== ldraw/parts/ jetzt: {len(list((LDRAW/"parts").glob("*.dat")))} Dateien ===')
print('Jetzt baken:  python3 tools/bake_catalog.py --force')
