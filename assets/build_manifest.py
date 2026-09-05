#!/usr/bin/env python3
"""Erzeugt assets/manifest.json aus den Dateien in assets/models/.

Erfasst pro Modell Pack, Gruppe, Groesse und Animationszahl. Fuer gerigte
Modelle wird zusaetzlich eine Rig-Signatur aus den Ruhepositionen einiger
Knochen gebildet — Figuren und Animationsbibliotheken mit derselben
Signatur passen zueinander, deshalb kann die Detailseite fremde Clips auf
eine Figur legen. Nur die Signatur vergleichen, nicht bloss die
Knochennamen: Rig_Large hat dieselben Namen wie Rig_Medium, ist aber
doppelt so gross, und seine Translationen zerreissen eine Medium-Figur.
"""
import os, json, re, struct

ROOT = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(ROOT, 'models')
SIG_BONES = ('hips', 'chest', 'head', 'upperarm.l', 'upperleg.l')


def read_gltf(path):
    if path.endswith('.glb'):
        b = open(path, 'rb').read()
        n = struct.unpack('<I', b[12:16])[0]
        return json.loads(b[20:20 + n])
    return json.load(open(path))


def rig_signature(j):
    """Kurzer Fingerabdruck der Skelettproportionen, oder None ohne Skin."""
    if not j.get('skins'):
        return None
    vals = []
    for name in SIG_BONES:
        for n in j.get('nodes', []):
            if n.get('name') == name:
                t = n.get('translation', [0, 0, 0])
                vals.append('%.3f,%.3f,%.3f' % tuple(t))
                break
        else:
            vals.append('-')
    return '|'.join(vals)


def prettify(s):
    s = re.sub(r'\.gltf$|\.glb$', '', re.sub(r'\.gltf\.glb$', '', s))
    s = s.replace('_', ' ').replace('-', ' ')
    return ' '.join(w[0].upper() + w[1:] if w and w[0].islower() else w
                    for w in s.split())


def pack_label(p):
    p = re.sub(r'_?(1|2)\.\d(\.\d)?', '', p).replace('_FREE', '').replace('FREE', '')
    p = p.replace('KayKit', '').replace('_', ' ').strip()
    return re.sub(r'\s+', ' ', p) or 'KayKit'


items, libs = [], []
sigs = {}                                    # Signatur -> kurze Rig-Id
for root, dirs, files in os.walk(MODELS):
    for f in sorted(files):
        if not f.endswith(('.gltf', '.glb')):
            continue
        path = os.path.join(root, f)
        rel = os.path.relpath(path, MODELS).replace(os.sep, '/')
        try:
            j = read_gltf(path)
        except Exception as e:
            print('  uebersprungen:', rel, e)
            continue
        segs = rel.split('/')
        idx = [s.lower() for s in segs].index('gltf')
        clips = [a.get('name') or ('Clip %d' % (i + 1))
                 for i, a in enumerate(j.get('animations', []))]
        sig = rig_signature(j)
        rig = None
        if sig:
            rig = sigs.setdefault(sig, 'rig%d' % (len(sigs) + 1))
        items.append({
            'id': rel, 'name': prettify(f), 'file': rel,
            'pack': segs[0], 'group': '/'.join(segs[idx + 1:-1]),
            'fmt': 'glb' if f.endswith('.glb') else 'gltf',
            'size': os.path.getsize(path),
            'anim': len(clips),
            **({'rig': rig} if rig else {}),
        })
        if clips and rig:
            libs.append({'file': rel, 'rig': rig,
                         'label': prettify(f).replace('Rig Large ', '')
                                             .replace('Rig Medium ', ''),
                         'clips': clips})

packs = sorted({i['pack'] for i in items})
man = {
    'generated': '2026-09-05',
    'packs': [{'id': p, 'label': pack_label(p),
               'count': sum(1 for i in items if i['pack'] == p)} for p in packs],
    'libs': libs,
    'items': items,
}
json.dump(man, open(os.path.join(ROOT, 'manifest.json'), 'w'), separators=(',', ':'))

# Kleine Extradatei fuer die Detailseite: nur Bibliotheken und die Rig-Id je
# gerigtem Modell — die Detailseite soll nicht das 500-KB-Manifest laden.
json.dump({'libs': libs,
           'rigs': {i['file']: i['rig'] for i in items if i.get('rig')}},
          open(os.path.join(ROOT, 'rigs.json'), 'w'), separators=(',', ':'))

rigged = [i for i in items if i.get('rig')]
print('%d Modelle, %d Packs' % (len(items), len(packs)))
print('%d Dateien mit Animationen, %d Clips insgesamt'
      % (sum(1 for i in items if i['anim']), sum(i['anim'] for i in items)))
print('%d gerigte Modelle, %d Rig-Varianten:' % (len(rigged), len(sigs)))
for sig, rid in sigs.items():
    n = sum(1 for i in rigged if i['rig'] == rid)
    c = sum(len(l['clips']) for l in libs if l['rig'] == rid)
    print('   %s: %d Modelle, %d Clips aus %d Bibliotheken'
          % (rid, n, c, sum(1 for l in libs if l['rig'] == rid)))
