#!/usr/bin/env python3
"""
Hi-res 48-Segment-Primitive (p/48/) nachladen — fehlen komplett, werden aber
von allen runden/gebogenen Teilen für glatte Oberflächen gebraucht.

Sammelt alle `48\\...`-Referenzen aus parts/, parts/s/, p/ und p/48/ und lädt
sie transitiv nach ldraw/p/48/. Zusätzlich werden p/-Primitive nachgezogen,
die von den 48er-Files referenziert werden.
"""
import re, time, urllib.request, urllib.error
from pathlib import Path

ROOT  = Path(__file__).parent.parent
LDRAW = ROOT / 'ldraw'
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

def fetch(rel, dest):
    if dest.exists():
        return -1
    for base in SOURCES:
        data = http_get(base + rel)
        if data:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            return 1
        time.sleep(0.02)
    return None

def refs_of(dat):
    """Sub-Referenzen (Typ-1-Zeilen) als (subdir, basename)."""
    out = []
    try:
        for line in dat.read_text(errors='ignore').splitlines():
            t = line.strip().split()
            if t and t[0] == '1' and len(t) >= 15:
                name = ' '.join(t[14:]).replace('\\', '/').lower()
                out.append((Path(name).parent.name, Path(name).name))
    except Exception:
        pass
    return out

# Iterativ bis Closure: alle 48/ und p/ Referenzen auflösen
new48 = newp = 0
for _ in range(8):
    added = 0
    src = (list((LDRAW/'parts').glob('*.dat')) + list((LDRAW/'parts'/'s').glob('*.dat'))
           + list((LDRAW/'p').glob('*.dat')) + list((LDRAW/'p'/'48').glob('*.dat')))
    for dat in src:
        for parent, base in refs_of(dat):
            if parent == '48':
                dest = LDRAW/'p'/'48'/base
                if not dest.exists() and fetch(f'p/48/{base}', dest) is not None:
                    added += 1; new48 += 1
            elif parent in ('', 'p'):
                dest = LDRAW/'p'/base
                if not dest.exists() and fetch(f'p/{base}', dest) is not None:
                    added += 1; newp += 1
    if not added:
        break
    print(f'  +{added} neue Primitive')

print(f'\nNeue p/48/: {new48}')
print(f'Neue p/:    {newp}')
print(f'p/48/ jetzt: {len(list((LDRAW/"p"/"48").glob("*.dat")))} Dateien')
