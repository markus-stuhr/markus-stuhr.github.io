#!/usr/bin/env python3
"""
LDraw-Dateien für den Brick Builder lokal herunterladen.

Was wird geladen:
  1. LDConfig.ldr  (Farben/Materialien)
  2. parts/{id}.dat  für alle deduplizierten Parts (eine pro W×D pro Kategorie)
  3. p/*.dat  alle Primitive (gemeinsame Geometrie-Bausteine)
  4. parts/s/*.dat  alle Sub-Parts

Ausgabe: brick/ldraw/ → wird von LDrawLoader als lokaler Pfad genutzt.
"""

import json, os, re, time, urllib.request, urllib.error
from pathlib import Path

CDN = 'https://cdn.jsdelivr.net/gh/gkjohnson/ldraw-parts-library@master/complete/ldraw/'
OUT = Path(__file__).parent.parent / 'ldraw'
DATA = Path(__file__).parent.parent / 'data' / 'parts.json'

def fetch(url, dest):
    dest = Path(dest)
    if dest.exists():
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(url, dest)
        return True
    except urllib.error.HTTPError as e:
        if e.code == 403:
            return False  # nicht vorhanden
        raise
    except Exception as e:
        print(f'  FEHLER {url}: {e}')
        return False

def deduped_ids():
    with open(DATA) as f:
        data = json.load(f)
    seen_global = {}  # (w,d,type) → id — global dedup wie im Browser
    for cat in data['categories']:
        seen_cat = {}
        for p in cat['parts']:
            key = (p['w'], p['d'])
            if key not in seen_cat:
                seen_cat[key] = p['id']
    ids = set()
    for cat in data['categories']:
        seen = {}
        for p in cat['parts']:
            key = (p['w'], p['d'])
            if key not in seen:
                seen[key] = p['id']
                ids.add(p['id'])
    return ids

# ── 1. LDConfig.ldr ──────────────────────────────────────────────────────────
print('Lade LDConfig.ldr ...')
fetch(CDN + 'LDConfig.ldr', OUT / 'LDConfig.ldr')

# ── 2. Parts ─────────────────────────────────────────────────────────────────
ids = deduped_ids()
print(f'\nLade {len(ids)} deduped Parts ...')
ok = fail = 0
for pid in sorted(ids):
    url = CDN + f'parts/{pid}.dat'
    dest = OUT / 'parts' / f'{pid}.dat'
    if fetch(url, dest):
        ok += 1
    else:
        fail += 1
    if (ok + fail) % 50 == 0:
        print(f'  {ok+fail}/{len(ids)} ({fail} nicht gefunden)')
    time.sleep(0.05)  # CDN-Rate-Limit schonen
print(f'  Parts: {ok} geladen, {fail} nicht gefunden')

# ── 3. Primitives (p/) ───────────────────────────────────────────────────────
# Liste aller Primitive aus dem CDN-Index holen
print('\nLade Primitive (p/) ...')

# Bekannte Primitive direkt auflisten (CDN hat kein directory listing)
# Wir sammeln stattdessen alle Referenzen aus den heruntergeladenen Parts
refs = set()
for dat in (OUT / 'parts').glob('*.dat'):
    for line in dat.read_text(errors='ignore').splitlines():
        parts_line = line.strip().split()
        if parts_line and parts_line[0] == '1':
            # Subfile-Referenz: 1 color x y z ... filename
            fname = parts_line[-1].replace('\\', '/').lower()
            refs.add(fname)

print(f'  {len(refs)} Referenzen in Parts gefunden')

p_ok = p_fail = s_ok = s_fail = 0

for ref in sorted(refs):
    name = Path(ref).name
    subdir = Path(ref).parent.name if '/' in ref else ''

    # Sub-Parts (s/)
    if 's/' in ref or subdir == 's':
        dest = OUT / 'parts' / 's' / name
        if not dest.exists():
            if fetch(CDN + f'parts/s/{name}', dest):
                s_ok += 1
            else:
                s_fail += 1
        continue

    # Primitive (p/)
    dest = OUT / 'p' / name
    if not dest.exists():
        if fetch(CDN + f'p/{name}', dest):
            p_ok += 1
        else:
            p_fail += 1
    time.sleep(0.02)

print(f'  Primitive (p/): {p_ok} geladen, {p_fail} nicht gefunden')
print(f'  Sub-Parts (parts/s/): {s_ok} geladen, {s_fail} nicht gefunden')

# ── 4. Rekursiv: Primitive die andere Primitive referenzieren ─────────────────
print('\nLade transitive Abhängigkeiten ...')
extra_ok = extra_fail = 0
for _ in range(3):  # max 3 Ebenen tief
    new_refs = set()
    for dat in (OUT / 'p').glob('*.dat'):
        for line in dat.read_text(errors='ignore').splitlines():
            pl = line.strip().split()
            if pl and pl[0] == '1':
                fname = pl[-1].replace('\\', '/').lower()
                name = Path(fname).name
                dest = OUT / 'p' / name
                if not dest.exists():
                    new_refs.add(name)
    if not new_refs:
        break
    for name in sorted(new_refs):
        dest = OUT / 'p' / name
        if fetch(CDN + f'p/{name}', dest):
            extra_ok += 1
        else:
            extra_fail += 1
        time.sleep(0.02)
    print(f'  +{extra_ok} weitere Primitive')

# ── Zusammenfassung ──────────────────────────────────────────────────────────
print('\n=== Fertig ===')
total = sum(1 for _ in OUT.rglob('*.dat')) + sum(1 for _ in OUT.glob('*.ldr'))
print(f'Dateien in ldraw/: {total}')
for sub in ['', 'parts', 'p', 'parts/s']:
    path = OUT / sub if sub else OUT
    n = len(list(path.glob('*.dat'))) + len(list(path.glob('*.ldr')))
    if n:
        print(f'  {sub or "root":<12} {n} Dateien')
