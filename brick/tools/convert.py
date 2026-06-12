#!/usr/bin/env python3
"""Rebrickable CSV → brick/data/parts.json + colors.json"""
import csv, json, re, os

DATA = os.path.join(os.path.dirname(__file__), '../data')

RENDER_CATS = {
    '11': ('Bricks',          'brick'),
    '14': ('Plates',          'plate'),
    '19': ('Tiles',           'tile'),
    '3':  ('Slopes',          'slope'),
    '6':  ('Wedges',          'wedge'),
    '5':  ('Bricks Special',  'brick'),
    '9':  ('Plates Special',  'plate'),
    '15': ('Tiles Special',   'tile'),
    '20': ('Round Bricks',    'round'),
    '21': ('Round Plates',    'round'),
    '37': ('Bricks Curved',   'brick'),
    '49': ('Plates Angled',   'plate'),
    '67': ('Tiles Round',     'tile'),
    '1':  ('Baseplates',      'plate'),
    '32': ('Bars & Fences',   'bar'),
    '23': ('Panels',          'panel'),
}

def parse_dims(name):
    m = re.search(r'(\d+)\s*[xX×]\s*(\d+)', name)
    if not m:
        return None
    w, d = int(m.group(1)), int(m.group(2))
    if 1 <= w <= 16 and 1 <= d <= 32:
        return w, d
    return None

# ── colors ───────────────────────────────────────────────────────────────────
with open(f'{DATA}/colors.csv', newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

colors_out = sorted([
    {
        'id':       int(r['id']),
        'name':     r['name'],
        'hex':      '#' + r['rgb'].upper(),
        'is_trans': r['is_trans'] == 'True',
    }
    for r in rows if r['id'] != '-1'
], key=lambda c: c['name'])

with open(f'{DATA}/colors.json', 'w', encoding='utf-8') as f:
    json.dump(colors_out, f, indent=2, ensure_ascii=False)
print(f'colors.json → {len(colors_out)} colors')

# ── parts ────────────────────────────────────────────────────────────────────
cat_map = {cid: {'id': int(cid), 'label': label, 'type': typ, 'parts': []}
           for cid, (label, typ) in RENDER_CATS.items()}

added = skipped = 0
with open(f'{DATA}/parts.csv', newline='', encoding='utf-8') as f:
    for p in csv.DictReader(f):
        cid = p['part_cat_id']
        if cid not in cat_map or p['part_material'] != 'Plastic':
            skipped += 1
            continue
        dims = parse_dims(p['name'])
        if not dims:
            skipped += 1
            continue
        w, d = dims
        cat_map[cid]['parts'].append({
            'id':   p['part_num'],
            'name': p['name'],
            'w':    w,
            'd':    d,
            'type': cat_map[cid]['type'],
        })
        added += 1

for cat in cat_map.values():
    cat['parts'].sort(key=lambda p: (p['w'], p['d'], p['name']))

categories = sorted(
    [c for c in cat_map.values() if c['parts']],
    key=lambda c: c['label']
)

with open(f'{DATA}/parts.json', 'w', encoding='utf-8') as f:
    json.dump({'categories': categories}, f, indent=2, ensure_ascii=False)

total = sum(len(c['parts']) for c in categories)
print(f'parts.json → {total} parts in {len(categories)} categories (skipped {skipped})')
for c in categories:
    print(f"  {c['label']:<22} {len(c['parts'])} parts")
