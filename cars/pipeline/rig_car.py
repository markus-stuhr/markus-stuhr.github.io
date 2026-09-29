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
# optional: Materialnamen (Regex) für Lack und Akzent (Sekundärfarbe) von Hand, '-' = automatisch/keiner
PAINT_OVR = args[5] if len(args) > 5 and args[5] != '-' else None
ACCENT_OVR = args[6] if len(args) > 6 and args[6] != '-' else None

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
    # nur kleine Objekte (Bodenplatten, Hilfsgeometrie) nach Größe aussortieren, nie echte Karosserieteile
    raus = len(o.data.vertices) < 1500 and any(b[0][i] < rlo[i] - 0.15 * rs[i] or b[1][i] > rhi[i] + 0.15 * rs[i] for i in range(3))
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

# 3b. Teile in der unteren Hälfte, die über mehrere Ecken reichen (z. B. alle Reifen oder Radkappen+Chrom in einem Mesh), in lose Stücke trennen
lo, hi = bbox(meshes)
H = hi.z - lo.z
for o in list(meshes):
    b = bbox([o])
    if b[0].z < 0.5 * H and (b[0].x < 0 < b[1].x or b[0].y < -0.1 * (hi.y - lo.y) and b[1].y > 0.1 * (hi.y - lo.y)):
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

def symmetrisch(o, b):
    # Reifen/Felgen sind ringförmig: der Punkt-Schwerpunkt liegt in der Box-Mitte.
    # Radhausschalen oder Schmutzfänger sind ähnlich groß, aber einseitig.
    vs = o.data.vertices
    step = max(1, len(vs) // 3000)
    n = sy_ = sz_ = 0.0
    for k in range(0, len(vs), step):
        sy_ += vs[k].co.y; sz_ += vs[k].co.z; n += 1
    m = (b[0] + b[1]) / 2; h = b[1].z - b[0].z
    return abs(sy_ / n - m.y) < 0.06 * h and abs(sz_ / n - m.z) < 0.06 * h

def find_wheels():
    found = {}
    for sy in (-1, 1):
        for sx in (-1, 1):
            def in_q(b):
                return sy * b[0].y > 0.1 * L and sx * b[0].x > 0 and sx * b[1].x > 0
            tyres = []
            for o, b in boxes.items():
                sz = b[1] - b[0]
                if in_q(b) and b[0].z < 0.08 * H and 0.12 * H < sz.z < 0.8 * H and 0.75 < sz.y / sz.z < 1.35 and symmetrisch(o, b):
                    tyres.append(o)
            if not tyres:
                continue
            # Referenz = größter Reifen; weitere Kandidaten nur, wenn ihre Mitte auf derselben Achse liegt
            # (sonst rutschen z. B. dunkle Schwellerteile am Boden mit ins Rad und verschieben die Achse)
            def mitte(o):
                return (boxes[o][0] + boxes[o][1]) / 2
            # Referenz = das Teil, das am tiefsten liegt (der Reifen berührt den Boden; Radhausschalen enden höher)
            ref = min(tyres, key=lambda o: (boxes[o][0].z, -(boxes[o][1] - boxes[o][0]).z))
            rc, rh = mitte(ref), (boxes[ref][1] - boxes[ref][0]).z
            tyres = [o for o in tyres if abs(mitte(o).y - rc.y) < 0.06 * rh and abs(mitte(o).z - rc.z) < 0.06 * rh]
            ulo, uhi = bbox(tyres)
            # zum Rad gehört alles, was in der Seitenansicht (y/z) im Reifen liegt und in der Breite (x)
            # nah dran ist — so kommt auch eine breite Lauffläche mit, wenn nur die Flanken als Reifen erkannt wurden
            e, xr = 0.02, 0.35 * rh
            wmax = max(0.6 * rh, max(boxes[o][1].x - boxes[o][0].x for o in tyres) * 1.05)
            def im_rad(b):
                mx = (b[0].x + b[1].x) / 2
                return (all(ulo[i] - e <= b[0][i] and b[1][i] <= uhi[i] + e for i in (1, 2))
                        and ulo.x - xr <= mx <= uhi.x + xr and (b[1].x - b[0].x) < wmax)
            # zusätzlich muss jeder Punkt im Reifenkreis liegen (in den Ecken der Box sitzen oft Karosserieteile)
            ac = (ulo + uhi) / 2; r = (uhi.z - ulo.z) / 2 * 1.03
            def im_kreis(o):
                vs = o.data.vertices
                step = max(1, len(vs) // 2000)
                return all((vs[k].co.y - ac.y) ** 2 + (vs[k].co.z - ac.z) ** 2 <= r * r for k in range(0, len(vs), step))
            parts = list(dict.fromkeys(tyres + [o for o, b in boxes.items() if im_rad(b) and im_kreis(o)]))
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

# 6b. Eingelenkte Räder geradestellen: Achsrichtung = Richtung mit der kleinsten Ausdehnung der Radscheibe (PCA);
# Räder, die im Originalmodell eingeschlagen sind, werden um die Hochachse zurückgedreht
import numpy as np
for key, (ulo, uhi, parts) in list(wheels.items()):
    pts = []
    for o in parts:
        vs = o.data.vertices
        step = max(1, len(vs) // 3000)
        pts += [tuple(vs[k].co) for k in range(0, len(vs), step)]
    P = np.array(pts); P -= P.mean(axis=0)
    w, v = np.linalg.eigh(np.cov(P.T))
    n = v[:, 0]                                   # kleinster Eigenwert = Achse
    yaw = math.atan2(n[1], n[0])                  # Winkel der Achse zur x-Achse (Draufsicht)
    if yaw > math.pi / 2: yaw -= math.pi
    if yaw < -math.pi / 2: yaw += math.pi
    # Sturz (Radneigung nach innen/außen): Winkel der Achse zur Waagerechten, nach dem Geradestellen
    horiz = math.hypot(n[0], n[1])
    sturz = math.atan2(n[2], horiz) * (1 if (n[0] * math.cos(yaw) + n[1] * math.sin(yaw)) >= 0 else -1)
    if abs(yaw) > math.radians(0.7) or abs(sturz) > math.radians(0.7):
        c = (ulo + uhi) / 2
        # erst Lenkeinschlag (um z) aufheben, dann Sturz (um die Längsachse y)
        m = (Matrix.Translation(c) @ Matrix.Rotation(sturz, 4, 'Y') @ Matrix.Rotation(-yaw, 4, 'Z')
             @ Matrix.Translation(-c))
        for o in parts:
            o.data.transform(m); o.data.update()
        nlo, nhi = bbox(parts)
        wheels[key] = (nlo, nhi, parts)
        Q = np.array([tuple(o.data.vertices[k].co) for o in parts for k in range(0, len(o.data.vertices), max(1, len(o.data.vertices) // 3000))])
        Q -= Q.mean(axis=0); n2 = np.linalg.eigh(np.cov(Q.T))[1][:, 0]
        print('REST', key, 'achse %.3f %.3f %.3f' % tuple(n2 / (n2[0] if abs(n2[0]) > 1e-6 else 1)))
        print('GERADE', key, 'lenk %.1f° sturz %.1f°' % (math.degrees(yaw), math.degrees(sturz)))

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
if PAINT_OVR:
    kand = [m for m in area if re.search(PAINT_OVR, m.name)]
else:
    kand = [m for m in area if PAINT.search(m.name) and not NOPAINT.search(m.name)]
    if not kand:
        kand = [m for m in area if bunt(m) and not NOPAINT.search(m.name)]
paint = []
if kand:
    top = max(area[m] for m in kand)
    paint = kand if PAINT_OVR else [m for m in kand if area[m] > 0.15 * top]
accent = [m for m in area if ACCENT_OVR and re.search(ACCENT_OVR, m.name) and m not in paint]
print('PAINT', [m.name for m in paint], 'ACCENT', [m.name for m in accent])
# Materialien nicht zusammenlegen (jedes behält seine Textur), nur einheitlich benennen: paint_1.., accent_1..
for pre, ms in (('paint', paint), ('accent', accent)):
    for i, m in enumerate(sorted(ms, key=lambda m: -area[m]), 1):
        m.name = '%s_%d' % (pre, i)

# 7c. Vereinfachen (gegen Ruckeln): pro Gruppe (body, jedes Rad) alle Teile mit gleichem Material zu einem Mesh
# zusammenfügen (weniger Zeichenaufrufe), dann auf ein Dreiecksbudget dezimieren
BUDGET = 150000
def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)

def merge_group(parent):
    kids = [o for o in parent.children if o.type == 'MESH']
    # Objekte mit mehreren Materialien erst nach Material trennen
    for o in list(kids):
        if len([s for s in o.material_slots if s.material]) > 1:
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True); bpy.context.view_layer.objects.active = o
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
    kids = [o for o in parent.children if o.type == 'MESH' and len(o.data.polygons)]
    nach_mat = {}
    for o in kids:
        m = next((s.material for s in o.material_slots if s.material), None)
        nach_mat.setdefault(m, []).append(o)
    for m, objs in nach_mat.items():
        if len(objs) < 2:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()

gruppen = [body] + [o for o in bpy.data.objects if o.name.endswith('_spin')]
for g in gruppen:
    merge_group(g)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
vorher = sum(tris(o) for o in meshes)
ratio = min(1.0, BUDGET / max(vorher, 1))
if ratio < 0.98:
    for o in meshes:
        if tris(o) < 300:
            continue
        mod = o.modifiers.new('dec', 'DECIMATE'); mod.ratio = ratio; mod.use_collapse_triangulate = True
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            bpy.ops.object.modifier_apply(modifier='dec')
print('SIMPLIFY meshes %d dreiecke %d -> %d' % (len(meshes), vorher, sum(tris(o) for o in meshes)))

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
