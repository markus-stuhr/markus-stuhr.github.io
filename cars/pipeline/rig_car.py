# Bereitet ein Sketchfab-Automodell für /cars auf (Blender headless):
#   blender --background --python rig_car.py -- <in.glb> <out.glb> <laenge_m> <flip:auto|0|1> [max_textur_px]
#
# Ergebnis (glTF-Koordinaten, 1 Einheit = 1 m):
#   - Front zeigt nach +Z, links = +X, Boden bei y = 0, Ursprung mittig zwischen den Achsen
#   - Knoten: car > body (alle Karosserieteile) und car > wheel_FL|FR|RL|RR (Lenk-Drehpunkt, dreht um y)
#             > wheel_XX_spin (Roll-Drehpunkt in Radmitte, dreht um x)
#   - car.extras: laenge, radstand, spur, radius (für Fahrphysik später)
import bpy, sys, math
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
SRC, DST, LAENGE, FLIP = args[0], args[1], float(args[2]), args[3]
MAXTEX = int(args[4]) if len(args) > 4 else 1024

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)

# 1. Alles zu eigenständigen Meshes ohne Hierarchie mit angewendeten Transformationen machen
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in bpy.data.objects:
    o.select_set(o.type == 'MESH')
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.make_single_user(object=True, obdata=True)
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']

def bbox(objs):
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        for v in o.data.vertices:
            for i in range(3):
                lo[i] = min(lo[i], v.co[i]); hi[i] = max(hi[i], v.co[i])
    return lo, hi

def robust_bbox(objs, q=0.01):
    # Karosseriemaße aus den Vertex-Perzentilen, damit einzelne Riesenobjekte nicht zählen
    import statistics
    cs = [[], [], []]
    for o in objs:
        vs = o.data.vertices
        step = max(1, len(vs) // 2000)
        for k in range(0, len(vs), step):
            v = vs[k]
            for i in range(3):
                cs[i].append(v.co[i])
    lo = Vector([sorted(c)[int(len(c) * q)] for c in cs]); hi = Vector([sorted(c)[int(len(c) * (1 - q)) - 1] for c in cs])
    return lo, hi

def transform_all(m):
    for o in meshes:
        o.data.transform(m)
        o.data.update()

# 1b. Hilfsobjekte entfernen: Schatten-/Bodenflächen, Umgebungskugeln, Kollisionsmeshes
import re
JUNK = re.compile(r'shadow|icosphere|collision|_col\b|bullet_col|ground|floor|backdrop|studio|\bplane\b', re.I)
rlo, rhi = robust_bbox(meshes)
rs = rhi - rlo
def remove(o):
    meshes.remove(o); bpy.data.objects.remove(o)
for o in list(meshes):
    b = bbox([o])
    raus = any(b[0][i] < rlo[i] - 0.15 * rs[i] or b[1][i] > rhi[i] + 0.15 * rs[i] for i in range(3))
    if JUNK.search(o.name) or (o.material_slots and any(s.material and JUNK.search(s.material.name) for s in o.material_slots)) or raus:
        print('JUNK', o.name, len(o.data.vertices))
        remove(o)

# 2. Längsachse auf Blender-Y legen (Blender -Y = glTF +Z = vorne)
lo, hi = bbox(meshes)
if hi.x - lo.x > hi.y - lo.y:
    transform_all(Matrix.Rotation(math.pi / 2, 4, 'Z'))

# 3. Auf echte Länge skalieren und auf den Boden stellen
lo, hi = bbox(meshes)
f = LAENGE / (hi.y - lo.y)
transform_all(Matrix.Scale(f, 4))
lo, hi = bbox(meshes)
transform_all(Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))))

# 3b. Teile am Boden, die über mehrere Ecken reichen (z. B. alle Reifen in einem Mesh), in lose Stücke trennen
lo, hi = bbox(meshes)
H = hi.z - lo.z
for o in list(meshes):
    b = bbox([o])
    if b[0].z < 0.08 * H and (b[0].x < 0 < b[1].x or b[0].y < -0.1 * (hi.y - lo.y) and b[1].y > 0.1 * (hi.y - lo.y)):
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
        neu = [x for x in bpy.context.selected_objects if x not in meshes]
        if len(neu) > 400:
            # zu kleinteilig (Karosserie) -> wieder zusammenfügen
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.join()
        else:
            meshes.extend(neu)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']

# 4. Räder finden: pro Ecke runde Teile, die den Boden berühren = Reifen; alles darin gehört zum Rad
lo, hi = bbox(meshes)
H, L = hi.z - lo.z, hi.y - lo.y
boxes = {o: bbox([o]) for o in meshes}

def find_wheels():
    found = {}
    for sy in (-1, 1):
        for sx in (-1, 1):
            def in_q(b):
                return sy * b[0].y > 0.1 * L and sx * b[0].x > 0 and sx * b[1].x > 0
            tyres = []
            for o, b in boxes.items():
                sz = b[1] - b[0]
                if in_q(b) and b[0].z < 0.08 * H and 0.12 * H < sz.z < 0.8 * H and 0.75 < sz.y / sz.z < 1.35:
                    tyres.append(o)
            if not tyres:
                continue
            ulo, uhi = bbox(tyres)
            e = 0.02
            parts = [o for o, b in boxes.items()
                     if all(ulo[i] - e <= b[0][i] and b[1][i] <= uhi[i] + e for i in range(3))]
            found[(sx, sy)] = (ulo, uhi, parts)
    return found

wheels = find_wheels()
print('RAEDER', len(wheels), [len(w[2]) for w in wheels.values()])

# 5. Front bestimmen: Hinterreifen sind bei Sportwagen breiter (auto), sonst per Argument
def breite(sy):
    ws = [w for k, w in wheels.items() if k[1] == sy]
    return sum(w[1].x - w[0].x for w in ws) / max(len(ws), 1)
if FLIP == 'auto':
    # vorne = -Y; sind die Räder auf -Y breiter, liegt dort das Heck -> drehen
    flip = len(wheels) == 4 and breite(-1) > breite(1) * 1.03
else:
    flip = FLIP == '1'
print('BREITE -Y %.3f +Y %.3f FLIP %s' % (breite(-1), breite(1), flip))
if flip:
    transform_all(Matrix.Rotation(math.pi, 4, 'Z'))
    boxes = {o: bbox([o]) for o in meshes}
    wheels = find_wheels()

# 6. Ursprung mittig zwischen die Achsen legen
if len(wheels) == 4:
    ys = [(w[0].y + w[1].y) / 2 for w in wheels.values()]
    mid = (min(ys) + max(ys)) / 2
    transform_all(Matrix.Translation(Vector((0, -mid, 0))))
    boxes = {o: bbox([o]) for o in meshes}
    wheels = find_wheels()

# 7. Hierarchie aufbauen
def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent:
        e.parent = parent
    return e

car = empty('car', (0, 0, 0))
body = empty('body', (0, 0, 0), car)
in_wheel = set()
radien, achsen, spuren = [], {}, {}
for (sx, sy), (ulo, uhi, parts) in wheels.items():
    # Blender -Y = vorne; +X = links
    name = 'wheel_' + ('F' if sy < 0 else 'R') + ('L' if sx > 0 else 'R')
    c = (ulo + uhi) / 2
    steer = empty(name, c, car)
    spin = empty(name + '_spin', (0, 0, 0), steer)
    bpy.context.view_layer.update()
    for o in parts:
        in_wheel.add(o)
        o.parent = spin
        o.matrix_parent_inverse = spin.matrix_world.inverted()
    radien.append((uhi.z - ulo.z) / 2)
    achsen.setdefault(sy, []).append(c.y)
    spuren.setdefault(sy, []).append(c.x)
for o in meshes:
    if o not in in_wheel:
        o.parent = body
        o.matrix_parent_inverse = body.matrix_world.inverted()

car['laenge'] = round(LAENGE, 3)
if len(wheels) == 4:
    car['radstand'] = round(abs(sum(achsen[1]) / 2 - sum(achsen[-1]) / 2), 3)
    car['spur'] = round(abs(spuren[-1][0] - spuren[-1][1]), 3)
car['radius'] = round(sum(radien) / max(len(radien), 1), 3)
print('EXTRAS', dict(car.items()))

# 7b. Lack vereinheitlichen: alle Lackflächen teilen sich ein Material 'paint' (für den Lack-Editor).
# Glas und Lichter bleiben unangetastet, sonst verlieren Scheinwerfer ihr Aussehen.
import colorsys
PAINT = re.compile(r'(^|[^a-z])(car_?paint|paint|body|lack)([^a-z]|$)', re.I)
NOPAINT = re.compile(r'interior|seat|belt|badge|logo|carbon|chrome|black|plastic|glass|light|rubber|tyre|tire', re.I)
def bsdf(m):
    return next((n for n in (m.node_tree.nodes if m.use_nodes else []) if n.type == 'BSDF_PRINCIPLED'), None)
area = {}
for o in meshes:
    if o in in_wheel:
        continue
    a = sum(p.area for p in o.data.polygons) / max(len(o.material_slots), 1)
    for sl in o.material_slots:
        if sl.material:
            area[sl.material] = area.get(sl.material, 0) + a
def bunt(m):
    b = bsdf(m)
    if not b or b.inputs['Base Color'].is_linked or b.inputs['Alpha'].default_value < 0.9:
        return False
    r, g, bl = b.inputs['Base Color'].default_value[:3]
    h, l, sat = colorsys.rgb_to_hls(r, g, bl)
    return sat > 0.35 and l > 0.03
kand = [m for m in area if PAINT.search(m.name) and not NOPAINT.search(m.name)]
if not kand:
    kand = [m for m in area if bunt(m) and not NOPAINT.search(m.name)]
paint = []
if kand:
    top = max(area[m] for m in kand)
    paint = [m for m in kand if area[m] > 0.15 * top]
print('PAINT', [m.name for m in paint])
if paint:
    haupt = max(paint, key=lambda m: area[m])
    haupt.name = 'paint'
    for o in meshes:
        for sl in o.material_slots:
            if sl.material in paint:
                sl.material = haupt

# 8. Texturen verkleinern und exportieren
for img in bpy.data.images:
    if len(img.pixels) == 0:
        img.reload()
    w, h = img.size
    if max(w, h) > MAXTEX:
        s = MAXTEX / max(w, h)
        img.scale(max(1, int(w * s)), max(1, int(h * s)))

bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', export_image_format='AUTO', export_extras=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)
