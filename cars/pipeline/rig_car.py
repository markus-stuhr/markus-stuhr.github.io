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


def ueberstand(key, teile, cz_):
    # Laufflächen-Radius = Median der Sektor-Höchstwerte (obere Hälfte, Aufstandsfläche ist oft abgeplattet);
    # Einzelteile, die >10 % darüber hinausragen (Laufflächen-Stücke liegen bis ~4 % darüber) (z. B. Radhausteile mit demselben Material), gehören nicht zum Rad
    Q = np.concatenate([verts_np(o, key) for o in teile])
    d = np.hypot(Q[:, 1] - cz_.y, Q[:, 2] - cz_.z); w = np.degrees(np.arctan2(Q[:, 2] - cz_.z, Q[:, 1] - cz_.y))
    sek = [d[(w >= a) & (w < a + 30)].max() for a in list(range(-180, -150, 30)) + list(range(-30, 180, 30)) if ((w >= a) & (w < a + 30)).any()]
    rt = float(np.median(sek)); grenze = rt * 1.10; raus = []
    for o in list(teile):
        V = verts_np(o, key)
        bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
        gesehen = set(); weg = []
        for f0 in bm.faces:
            if f0.index in gesehen: continue
            stapel = [f0]; insel = []; gesehen.add(f0.index)
            while stapel:
                f = stapel.pop(); insel.append(f)
                for e in f.edges:
                    for g in e.link_faces:
                        if g.index not in gesehen:
                            gesehen.add(g.index); stapel.append(g)
            idx = [v.index for f in insel for v in f.verts]
            dd = np.hypot(V[idx, 1] - cz_.y, V[idx, 2] - cz_.z)
            if dd.max() > grenze:
                if os.environ.get('UEB'):
                    mi = insel[0].material_index; ms = [sl.material.name if sl.material else '-' for sl in o.material_slots]
                    print('UEB %s max %.3f min %.3f (x rt) faces %d %s' % (key, dd.max() / rt, dd.min() / rt, len(insel), ms[mi][-30:] if mi < len(ms) else '-'))
                weg += insel
        if not weg:
            bm.free(); continue
        for f in bm.faces: f.select_set(False)
        for f in weg: f.select_set(True)
        bm.to_mesh(o.data); bm.free()
        if len(weg) == len(o.data.polygons):
            teile.remove(o); raus.append(o); continue
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
        ab = [x for x in bpy.context.selected_objects if x is not o]
        meshes.extend(ab); raus += ab
    if raus:
        print('UEBERSTAND %s Lauffläche %.3f, %d Teile ragen darüber hinaus -> Karosserie' % (key, rt, len(raus)))
        ueber_raus.extend(raus)
    return teile


REIFEN_MAT = None
def neuer_reifen(key, teile, cz_, x0, x1):
    global REIFEN_MAT
    Q = np.concatenate([verts_np(o) for o in teile])
    d = np.hypot(Q[:, 1] - cz_.y, Q[:, 2] - cz_.z); w = np.degrees(np.arctan2(Q[:, 2] - cz_.z, Q[:, 1] - cz_.y))
    oben = np.abs(w + 90) > 40
    rt = float(np.percentile(d[oben], 99.5))           # Laufflächen-Radius (obere Hälfte, unverformt)
    einsinken.append(rt - cz_.z)                        # so weit steckt der runde Reifen im Boden -> Auto anheben
    rf = 0.76 * rt                                      # Felgenhorn: alles außerhalb gehört zum Reifen
    geloescht = 0
    for o in list(teile):
        V = verts_np(o); dv = np.hypot(V[:, 1] - cz_.y, V[:, 2] - cz_.z)
        bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
        # jede Fläche, die über das Felgenhorn hinausragt (der Originalreifen wird komplett ersetzt)
        weg = [f for f in bm.faces if max(dv[v.index] for v in f.verts) > rf + 0.003]
        if weg:
            geloescht += len(weg)
            bmesh.ops.delete(bm, geom=weg, context='FACES')
            bm.to_mesh(o.data)
        bm.free()
        if len(o.data.polygons) == 0:
            teile.remove(o)
    # Reifen erzeugen: Profil im (axial, radial)-Schnitt, um die x-Achse gedreht
    b = x1 - x0; xm = (x0 + x1) / 2; sh = 0.18 * b          # Schulterrundung
    prof = [(-b/2 + 0.02*b, rf), (-b/2, rf + 0.3*(rt - rf)), (-b/2, rt - sh)]
    for i in range(1, 6):
        a = math.pi/2 * i / 6
        prof.append((-b/2 + sh - sh*math.cos(a), rt - sh + sh*math.sin(a)))
    prof += [(-b/2 + sh, rt), (b/2 - sh, rt)]
    for i in range(1, 6):
        a = math.pi/2 * i / 6
        prof.append((b/2 - sh + sh*math.sin(a), rt - sh*(1 - math.cos(a))))
    prof += [(b/2, rt - sh), (b/2, rf + 0.3*(rt - rf)), (b/2 - 0.02*b, rf)]
    # Profil: drei umlaufende Rillen in der Lauffläche, Schulterblöcke (jedes zweite Segment 4 mm tiefer)
    lauf = [(-b/2 + sh + (b - 2*sh) * i / 16, rt) for i in range(17)]
    rillen = {4, 8, 12}
    lauf = [(ax, rt - 0.005 if i in rillen else rt) for i, (ax, _) in enumerate(lauf)]
    prof = prof[:prof.index((-b/2 + sh, rt))] + lauf + prof[prof.index((b/2 - sh, rt)) + 1:]
    schulter = {i for i, (ax, rad) in enumerate(prof) if abs(abs(ax) - (b/2 - sh/2)) < sh * 0.6 and rad > rt - sh}
    N = 96
    bm = bmesh.new(); ringe = []
    for k in range(N):
        t = 2 * math.pi * k / N
        ringe.append([bm.verts.new((xm + ax, cz_.y + (rad - (0.004 if (k % 2 and j in schulter) else 0)) * math.cos(t),
                                    cz_.z + (rad - (0.004 if (k % 2 and j in schulter) else 0)) * math.sin(t)))
                      for j, (ax, rad) in enumerate(prof)])
    for k in range(N):
        A, B = ringe[k], ringe[(k + 1) % N]
        for j in range(len(prof) - 1):
            bm.faces.new((A[j], A[j+1], B[j+1], B[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('reifen_neu'); bm.to_mesh(me); bm.free()
    for pg in me.polygons: pg.use_smooth = True
    if REIFEN_MAT is None:
        REIFEN_MAT = bpy.data.materials.new('tyre_neu'); REIFEN_MAT.use_nodes = True
        bs = REIFEN_MAT.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Base Color'].default_value = (0.018, 0.018, 0.02, 1); bs.inputs['Roughness'].default_value = 0.85
    me.materials.append(REIFEN_MAT)
    ob = bpy.data.objects.new('reifen_neu', me); bpy.context.scene.collection.objects.link(ob)
    meshes.append(ob); teile.append(ob)
    print('NEUER-REIFEN %s r %.3f felgenhorn %.3f breite %.3f (%d Originalflächen entfernt)' % (key, rt, rf, b, geloescht))
    return teile

from mathutils.kdtree import KDTree

def taumel(pts, c, a, b, dy, dz, winkel=(45, 135, 225)):
    # Achse um a (Hochachse) und b (Längsachse) gekippt, Mitte um dy/dz verschoben: Punkte so drehen, dass diese
    # Achse zur x-Achse wird, dann um x drehen und mittleren Abstand zur Originalform messen (mm)
    R = (Matrix.Rotation(-b, 3, 'Y') @ Matrix.Rotation(-a, 3, 'Z')).to_4x4()
    m = Vector((c.x, c.y + dy, c.z + dz))
    P = [R @ (Vector(p) - m) for p in pts]
    kd = KDTree(len(P))
    for i, p in enumerate(P): kd.insert(p, i)
    kd.balance()
    summe = 0.0; n = 0
    for w in winkel:
        Rx = Matrix.Rotation(math.radians(w), 3, 'X')
        for p in P[::2]:
            summe += kd.find(Rx @ p)[2]; n += 1
    return summe / n * 1000 if n else 0.0

# 6b. Eingelenkte Räder geradestellen: Achsrichtung = Richtung mit der kleinsten Ausdehnung der Radscheibe (PCA);
# Räder, die im Originalmodell eingeschlagen sind, werden um die Hochachse zurückgedreht
import numpy as np, os
rad_lenk = {}
# „reine Rad-Materialien“: liegen zu ≥90 % in großzügigen Bereichen um die vier Räder (Originalwinkel, ohne Lenkkorrektur)
def _rein():
    zb = []
    for (ulo, uhi, parts) in wheels.values():
        cc = (ulo + uhi) / 2; rr = (uhi.z - ulo.z) / 2
        zb.append((np.array(cc), rr))
    drin, ges = {}, {}
    for o in meshes:
        a = np.empty(len(o.data.vertices) * 3); o.data.vertices.foreach_get('co', a); V = a.reshape(-1, 3)
        mats = [sl.material for sl in o.material_slots]
        for p in o.data.polygons:
            m = mats[p.material_index] if p.material_index < len(mats) else None
            c = V[list(p.vertices)].mean(axis=0)
            ges[m] = ges.get(m, 0) + p.area
            if any(np.linalg.norm(c - cc) < 1.5 * rr for cc, rr in zb):
                drin[m] = drin.get(m, 0) + p.area
    return {m for m in ges if m and drin.get(m, 0) >= 0.9 * ges[m]}
REIN = _rein() if os.environ.get('RAD') == 'zyl' else set()
if REIN:
    print('REIN', sorted(m.name for m in REIN))
for key, (ulo, uhi, parts) in list(wheels.items()):
    pts = []
    for o in parts:
        vs = o.data.vertices
        step = max(1, len(vs) // 3000)
        pts += [tuple(vs[k].co) for k in range(0, len(vs), step)]
    P = np.array(pts)
    if REIN:
        # Punkte aller reinen Rad-Materialien in der Nähe dieses Rads (auch Teile, die vorab nicht erkannt wurden)
        cc0 = np.array((ulo + uhi) / 2); rr0 = (uhi.z - ulo.z) / 2; Q = []
        for o in meshes:
            mats = [sl.material for sl in o.material_slots]
            if not any(m in REIN for m in mats): continue
            a = np.empty(len(o.data.vertices) * 3); o.data.vertices.foreach_get('co', a); V = a.reshape(-1, 3)
            V = V[np.linalg.norm(V - cc0, axis=1) < 1.5 * rr0]
            if len(V): Q.append(V)
        if Q:
            P = np.concatenate(Q)
    # nur der äußere Ring (Reifen) zählt: Bremssättel/Naben sind unsymmetrisch und verfälschen die Achse
    cc = (ulo + uhi) / 2; rr = (uhi.z - ulo.z) / 2
    # 3D-Abstand zur Mitte: bei eingelenkten Rädern ist die Seitenansicht (y/z) eine Ellipse, dort würde der
    # Ring nur oben/unten Punkte behalten und die Achse falsch schätzen
    ring = P[np.linalg.norm(P - np.array(cc), axis=1) > 0.8 * rr]
    if len(ring) > 50:
        P = ring
    P0 = P
    P = P - P.mean(axis=0)
    w, v = np.linalg.eigh(np.cov(P.T))
    n = v[:, 0]                                   # kleinster Eigenwert = Achse
    yaw = math.atan2(n[1], n[0])                  # Winkel der Achse zur x-Achse (Draufsicht)

    if yaw > math.pi / 2: yaw -= math.pi
    if yaw < -math.pi / 2: yaw += math.pi
    if os.environ.get('RAD') == 'zyl' and abs(yaw) < math.radians(35):
        # Feinsuche per Dreh-Test ±8° um die PCA-Schätzung (nur Reifenring)
        R0 = P0 if len(P0) <= 2000 else P0[np.random.default_rng(2).choice(len(P0), 2000, replace=False)]
        pts = [tuple(q) for q in R0]; mitte = Vector(R0.mean(axis=0))
        kand = [(taumel(pts, mitte, yaw + math.radians(g), 0.0, 0.0, 0.0), g) for g in np.arange(-8, 8.01, 1.0)]
        g0 = min(kand)[1]
        kand = [(taumel(pts, mitte, yaw + math.radians(g), 0.0, 0.0, 0.0), g) for g in np.arange(g0 - 1, g0 + 1.01, 0.25)]
        yaw += math.radians(min(kand)[1])
    # Sturz (Radneigung nach innen/außen): Winkel der Achse zur Waagerechten, nach dem Geradestellen
    horiz = math.hypot(n[0], n[1])
    sturz = math.atan2(n[2], horiz) * (1 if (n[0] * math.cos(yaw) + n[1] * math.sin(yaw)) >= 0 else -1)
    # nur echten Lenkeinschlag grob geradestellen; die Feinausrichtung macht der Dreh-Test (achse_optimieren),
    # PCA wird von Bremssätteln u. Ä. verfälscht und hat sonst gerade Räder schief gemacht
    if abs(yaw) > math.radians(35):
        # unplausibel (echte Lenkeinschläge in Modellen < 35°): Schätzung verworfen
        print('GERADE', key, 'lenk %.1f° unplausibel, ignoriert' % math.degrees(yaw))
    elif abs(yaw) > math.radians(1.5) and os.environ.get('RAD') == 'zyl':
        # Zylinder-Modus: nicht hier drehen (sonst bleiben unerkannte Reifenteile im alten Winkel stehen),
        # sondern das Rad im Originalwinkel ausschneiden und danach komplett geradestellen (6c)
        rad_lenk[key] = (yaw, (ulo + uhi) / 2)
        print('GERADE', key, 'lenk %.1f° (nach dem Ausschneiden)' % math.degrees(yaw))
    elif abs(yaw) > math.radians(5):
        sturz = 0.0
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

# 6c. Räder als Zylinder (RAD=zyl): Mitte/Radius per Kreisanpassung an die Reifenlauffläche, Breite aus den
# Reifenpunkten; dann gehört jede FLÄCHE im Zylinder zum Rad, egal zu welchem Teil sie gehört.
# Bremssättel (Name) bleiben stehen. Am Ende Prüfwerte: Reste (Karosserieflächen im Reifen) und Unrundheit (mm).
import os, bmesh
STATISCH = re.compile(r'cal+ip|claip|brake|bremse|sattel', re.I)

def verts_np(o, key=None):
    a = np.empty(len(o.data.vertices) * 3); o.data.vertices.foreach_get('co', a)
    V = a.reshape(-1, 3)
    if key is not None and key in rad_lenk:
        # in das gerade gestellte Radsystem umrechnen: um die Hochachse durch die Radmitte zurückdrehen
        yaw, c = rad_lenk[key]; co, si = math.cos(-yaw), math.sin(-yaw)
        x, y = V[:, 0] - c.x, V[:, 1] - c.y
        V = np.c_[co * x - si * y + c.x, si * x + co * y + c.y, V[:, 2]]
    return V

def kreis_fit(y, z):
    # algebraischer Kreisfit (Kasa): y² + z² + D y + E z + F = 0
    A = np.c_[y, z, np.ones_like(y)]; b = -(y * y + z * z)
    D, E, F = np.linalg.lstsq(A, b, rcond=None)[0]
    cy, cz = -D / 2, -E / 2
    return cy, cz, math.sqrt(max(cy * cy + cz * cz - F, 1e-9))

def zylinder(key, ulo, uhi, parts):
    sx, sy = key
    c = (ulo + uhi) / 2; r = (uhi.z - ulo.z) / 2
    # nur Punkte der erkannten Radteile (ohne Bremssättel) — Karosserie daneben verfälscht Kreis und Breite
    nah = np.concatenate([verts_np(o, key) for o in parts if not STATISCH.search(o.name)])
    cy, cz = c.y, c.z
    for _ in range(4):
        d = np.hypot(nah[:, 1] - cy, nah[:, 2] - cz)
        # Lauffläche: Punkte nahe am äußeren Radius, im Breitenbereich der ursprünglichen Reifenbox
        lauf = nah[(d > 0.88 * r) & (d < 1.08 * r) & (nah[:, 0] > ulo.x - 0.05) & (nah[:, 0] < uhi.x + 0.05)]
        if len(lauf) < 20:
            break
        cy, cz, r = kreis_fit(lauf[:, 1], lauf[:, 2])
    d = np.hypot(nah[:, 1] - cy, nah[:, 2] - cz)
    reifen = nah[(d > 0.8 * r) & (d < 1.01 * r)]
    if REIN:
        # Breite nur am Reifenring der reinen Rad-Materialien messen (Innenleben wie Achsteile nicht mitzählen)
        Qr = [verts_np(o, key) for o in meshes if any(sl.material in REIN for sl in o.material_slots)]
        if Qr:
            Qr = np.concatenate(Qr)
            dq = np.hypot(Qr[:, 1] - cy, Qr[:, 2] - cz)
            ring = Qr[(dq > 0.8 * r) & (dq < 1.3 * r) & (np.abs(Qr[:, 0] - (ulo.x + uhi.x) / 2) < 0.4)]
            if len(ring) > 50:
                reifen = ring
    x0, x1 = np.percentile(reifen[:, 0], 0.5), np.percentile(reifen[:, 0], 99.5)
    return Vector((0, cy, cz)), r, x0, x1

def schneide_rad(key, cz_, r, x0, x1, karosse, bremse=False):
    # alle Flächen im Zylinder (Radius r·1.015, Breite x0..x1 ± 1 cm) in eigene Objekte abtrennen,
    # außer Flächen mit Karosserie-Material (Lack, Radhausschale …), auch wenn sie in den Zylinder ragen
    rr = r * 1.015; teile = []
    for o in list(meshes):
        ist_bremse = STATISCH.search(o.name) or any(sl.material and STATISCH.search(sl.material.name) for sl in o.material_slots)
        if o.type != 'MESH' or bool(ist_bremse) != bremse:
            continue
        V = verts_np(o, key)
        # Bremssättel sitzen innen hinter der Felge: nach innen (zur Wagenmitte) großzügiger
        xa, xb = (x0 - 0.01, x1 + 0.01) if not bremse else ((x0 - 0.15, x1 + 0.01) if x0 > 0 else (x0 - 0.01, x1 + 0.15))
        drin_v = (np.hypot(V[:, 1] - cz_.y, V[:, 2] - cz_.z) <= rr) & (V[:, 0] >= xa) & (V[:, 0] <= xb)
        if not drin_v.any():
            continue
        bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
        mats = [sl.material for sl in o.material_slots]
        # Einzelteile (Inseln), die komplett im Zylinder liegen, gehören zum Rad, auch mit Karosserie-Material
        # (z. B. Carbon-Speichen, wenn Carbon auch an der Karosserie vorkommt)
        bm.faces.ensure_lookup_table(); ganz = set(); gesehen = set()
        for f0 in bm.faces:
            if f0.index in gesehen: continue
            stapel = [f0]; insel = []; gesehen.add(f0.index)
            while stapel:
                f = stapel.pop(); insel.append(f)
                for e in f.edges:
                    for g in e.link_faces:
                        if g.index not in gesehen:
                            gesehen.add(g.index); stapel.append(g)
            if all(drin_v[v.index] for f in insel for v in f.verts):
                ganz.update(f.index for f in insel)
        sel = [f for f in bm.faces if all(drin_v[v.index] for v in f.verts)
               and (bremse or f.index in ganz or not (f.material_index < len(mats) and mats[f.material_index] in karosse))
               and (not bremse or (f.material_index < len(mats) and mats[f.material_index] and STATISCH.search(mats[f.material_index].name)) or STATISCH.search(o.name))]
        if not sel:
            bm.free(); continue
        if len(sel) == len(bm.faces):
            bm.free(); teile.append(o); continue
        for f in bm.faces: f.select_set(False)
        for f in sel: f.select_set(True)
        bm.to_mesh(o.data); bm.free()
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
        neu = [x for x in bpy.context.selected_objects if x is not o]
        meshes.extend(neu); teile.extend(neu)
    return teile

def pruefe(key, cz_, r, x0, x1, teile):
    # Reste: Flächen außerhalb des Rads, deren Mitte deutlich im Reifenbereich liegt
    reste = 0
    for o in meshes:
        if o in teile or STATISCH.search(o.name) or o in rad_bremsen.get(key, []):
            continue
        V = verts_np(o, key)
        for p in o.data.polygons:
            m = V[list(p.vertices)].mean(axis=0)
            if math.hypot(m[1] - cz_.y, m[2] - cz_.z) < 0.97 * r and x0 + 0.01 < m[0] < x1 - 0.01 and math.hypot(m[1] - cz_.y, m[2] - cz_.z) > 0.75 * r:
                reste += 1
    # Unrundheit: größter Radius je 10°-Sektor der Radteile, Spannweite in mm
    Q = np.concatenate([verts_np(o) for o in teile])
    a = np.degrees(np.arctan2(Q[:, 2] - cz_.z, Q[:, 1] - cz_.y)) // 10
    d = np.hypot(Q[:, 1] - cz_.y, Q[:, 2] - cz_.z)
    ks = np.unique(a); maxi = np.array([d[a == k].max() for k in ks])
    # Eiern = Achsversatz: Grundschwingung (1× pro Umdrehung) des Außenradius; Facetten der Polygonreifen
    # (mehrere Wellen pro Umdrehung) zählen nicht
    w = np.radians(ks * 10 + 5)
    unrund = math.hypot((maxi * np.cos(w)).mean() * 2, (maxi * np.sin(w)).mean() * 2) * 1000
    if os.environ.get('PROFIL'):
        print('PROFIL', key, ' '.join('%d:%.0f' % (k * 10, (m - r) * 1000) for k, m in zip(ks, maxi)))
    print('PRUEF %s reste %d versatz %.1fmm r %.3f breite %.3f teile %d' % (key, reste, unrund, r, x1 - x0, len(teile)))


def halbe_teile(key, teile, cz_, r, x0, x1):
    # Einzelteile (zusammenhängende Inseln) im Rad, die nicht rundherum gehen und hinter der Speichenebene liegen
    # (z. B. nur halb modellierte innere Felgenringe): dürfen sich nicht drehen -> werden abgetrennt
    sx = key[0]
    aussen = x0 if sx < 0 else x1                 # Außenseite des Rads
    breite = x1 - x0; neu = []
    for o in list(teile):
        bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
        gesehen = set(); weg = []
        for f0 in bm.faces:
            if f0.index in gesehen: continue
            stapel = [f0]; insel = []; gesehen.add(f0.index)
            while stapel:
                f = stapel.pop(); insel.append(f)
                for e in f.edges:
                    for g in e.link_faces:
                        # nur über Flächen gleichen Materials verbinden: ein Sattel, der an der Bremsscheibe hängt, ist ein eigenes Teil
                        if g.index not in gesehen and g.material_index == f.material_index:
                            gesehen.add(g.index); stapel.append(g)
            P = np.array([tuple(v.co) for f in insel for v in f.verts])
            ang = set((np.degrees(np.arctan2(P[:, 2] - cz_.z, P[:, 1] - cz_.y)) // 10).astype(int).tolist())
            innen = abs(P[:, 0].mean() - aussen) > 0.4 * breite
            dd = np.hypot(P[:, 1] - cz_.y, P[:, 2] - cz_.z); dmax = dd.max(); dmin = dd.min()
            # Reifenstücke reichen bis zur Lauffläche und bleiben am Rad; Speichen reichen bis zur Nabe.
            # Bremssattel-artig: nicht rundherum, beginnt erst ab 35 % des Radius (auch wenn nicht weit innen)
            sattel = dmin > 0.35 * r and dmax < 0.85 * r
            # innen liegende Halbteile ebenfalls nur, wenn sie nicht bis zur Nabe reichen (tief gewölbte Speichen tun das)
            if len(ang) * 10 < 300 and innen and dmin > 0.35 * r and dmax < 0.95 * r:
                if os.environ.get('HALBDBG'):
                    ms = [sl.material.name if sl.material else '-' for sl in o.material_slots]
                    print('HALBDBG %s %s faces %d winkel %d d %.2f..%.2f r innen %s sattel %s x %.3f..%.3f aussen %.3f' % (key, ms[insel[0].material_index] if insel[0].material_index < len(ms) else '-', len(insel), len(ang) * 10, dmin / r, dmax / r, innen, sattel, P[:, 0].min(), P[:, 0].max(), aussen))
                weg += insel
        if weg:
            for f in bm.faces: f.select_set(False)
            for f in weg: f.select_set(True)
            bm.to_mesh(o.data); bm.free()
            if len(weg) == len(o.data.polygons):
                teile.remove(o); neu.append(o); continue
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True); bpy.context.view_layer.objects.active = o
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
            ab = [x for x in bpy.context.selected_objects if x is not o]
            meshes.extend(ab); neu += ab
        else:
            bm.free()
    # zweite Runde: Materialien, von denen ein Stück stillsteht und die insgesamt nicht rundherum gehen
    # (z. B. Bremssattel aus mehreren Stücken), stehen komplett still
    stat_mats = {sl.material for o in neu for sl in o.material_slots if sl.material}
    # Sattel-Materialien: gehen insgesamt nicht rundherum und liegen komplett zwischen 35 und 85 % des Radius
    for o in teile:
        V = verts_np(o); mats = [sl.material for sl in o.material_slots]
        for i, m in enumerate(mats):
            if m is None or m in stat_mats: continue
            fl = [pg for pg in o.data.polygons if pg.material_index == i]
            if not fl: continue
            idx = sorted({v for pg in fl for v in pg.vertices})
            dd = np.hypot(V[idx, 1] - cz_.y, V[idx, 2] - cz_.z)
            if dd.min() > 0.35 * r and dd.max() < 0.85 * r:
                stat_mats.add(m)
    for m in stat_mats:
        Pm = []
        for o in teile:
            mats = [sl.material for sl in o.material_slots]
            V = verts_np(o)
            for pg in o.data.polygons:
                if pg.material_index < len(mats) and mats[pg.material_index] is m:
                    Pm.append(V[list(pg.vertices)].mean(axis=0))
        if not Pm: continue
        Pm = np.array(Pm)
        cov = len(set((np.degrees(np.arctan2(Pm[:, 2] - cz_.z, Pm[:, 1] - cz_.y)) // 10).astype(int).tolist())) * 10
        if cov >= 300: continue
        for o in list(teile):
            mats = [sl.material for sl in o.material_slots]
            idx = [i for i, sl in enumerate(mats) if sl is m]
            if not idx: continue
            bm = bmesh.new(); bm.from_mesh(o.data)
            weg = [f for f in bm.faces if f.material_index in idx]
            for f in bm.faces: f.select_set(False)
            for f in weg: f.select_set(True)
            bm.to_mesh(o.data); bm.free()
            if len(weg) == len(o.data.polygons):
                teile.remove(o); neu.append(o); continue
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True); bpy.context.view_layer.objects.active = o
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
            ab = [x for x in bpy.context.selected_objects if x is not o]
            meshes.extend(ab); neu += ab
    if neu:
        print('HALB %s %d Teile stehen still (nicht rundherum, innen)' % (key, len(neu)))
    return neu

def achse_optimieren(key, teile, c, r):
    # Reifenpunkte (äußerer Ring) sind eine Rotationsfläche: bei der richtigen Achse ändert Drehen nichts
    Q = np.concatenate([verts_np(o) for o in teile])
    d = np.hypot(Q[:, 1] - c.y, Q[:, 2] - c.z)
    Q = Q[d > 0.8 * r]
    if len(Q) > 2500:
        Q = Q[np.random.default_rng(1).choice(len(Q), 2500, replace=False)]
    pts = [tuple(p) for p in Q]
    best = (0.0, 0.0, 0.0, 0.0); cost = taumel(pts, c, *best); vorher = cost
    # grobe Rastersuche über Lenkwinkel/Sturz, damit die Feinsuche nicht in einem Nebenminimum hängen bleibt
    for ga in range(-6, 7):
        for gb in range(-4, 5):
            k = taumel(pts, c, math.radians(ga), math.radians(gb), 0.0, 0.0)
            if k < cost:
                cost, best = k, (math.radians(ga), math.radians(gb), 0.0, 0.0)
    for schritt_w, schritt_m in ((math.radians(1.5), 0.004), (math.radians(0.5), 0.0015), (math.radians(0.15), 0.0005)):
        besser = True
        while besser:
            besser = False
            for i in range(2):                    # nur Achsrichtung; die Mitte kommt aus dem Kreisfit
                for sgn in (-1, 1):
                    kand = list(best); kand[i] += sgn * (schritt_w if i < 2 else schritt_m)
                    k = taumel(pts, c, *kand)
                    if k < cost - 1e-4:
                        cost, best, besser = k, tuple(kand), True
    a, b, dy, dz = best
    print('TAUMEL %s vorher %.2fmm nachher %.2fmm  achse %.2f° %.2f°  mitte %+.1f %+.1f mm' % (key, vorher, cost, math.degrees(a), math.degrees(b), dy * 1000, dz * 1000))
    # Radteile so drehen/verschieben, dass die gefundene Achse exakt die x-Achse durch die Radmitte ist
    m = Vector((c.x, c.y + dy, c.z + dz))
    T = (Matrix.Translation(Vector((c.x, c.y, c.z))) @ (Matrix.Rotation(-b, 4, 'Y') @ Matrix.Rotation(-a, 4, 'Z'))
         @ Matrix.Translation(-m))
    for o in teile:
        o.data.transform(T); o.data.update()
    # Mitte: Kreisfit an die äußerste Lauffläche (was man als Eiern sieht), Radteile dorthin verschieben
    Q = np.concatenate([verts_np(o) for o in teile])
    d = np.hypot(Q[:, 1] - c.y, Q[:, 2] - c.z)
    # untere ±40° um den Aufstandspunkt auslassen (manche Modelle haben eine abgeplattete Aufstandsfläche)
    w = np.degrees(np.arctan2(Q[:, 2] - c.z, Q[:, 1] - c.y))
    oben = np.abs(w + 90) > 40
    lauf = Q[(d > 0.93 * d[oben].max()) & oben]
    ky, kz, kr = kreis_fit(lauf[:, 1], lauf[:, 2])
    # Felgenring (60–85 % des Radius, ohne unteren Bereich) als zweite Meinung: ist der Reifen verformt modelliert
    # (Lastverformung), weichen die Mitten ab -> nach der Felge richten, deren Eiern sieht man deutlicher
    rt = d[oben].max()
    lippe = Q[(d > 0.6 * rt) & (d < 0.85 * rt) & oben]
    if len(lippe) > 50:
        fy, fz, fr = kreis_fit(lippe[:, 1], lippe[:, 2])
        # verformt = unten deutlich flacher als oben (Lastverformung modelliert), nicht nur Mitten-Abweichung
        wq = np.degrees(np.arctan2(Q[:, 2] - kz, Q[:, 1] - ky)); dq = np.hypot(Q[:, 1] - ky, Q[:, 2] - kz)
        unten = dq[np.abs(wq + 90) < 25]; obenr = dq[np.abs(wq - 90) < 60]
        platt = (len(unten) and len(obenr)) and (np.percentile(obenr, 99) - unten.max() > 0.012)
        if platt and math.hypot(fy - ky, fz - kz) > 0.005:
            print('VERFORMT %s Reifen-Mitte weicht %.1f mm von der Felge ab -> Achse nach Felge, Reifen dreht nicht' % (key, math.hypot(fy - ky, fz - kz) * 1000))
            ky, kz = fy, fz
            verformt.add(key)
    # Nabe (Zentralverschluss/Radmuttern, inneres Fünftel) ist der zuverlässigste Achspunkt: Schwerpunkt der
    # Punkte im Nabenbereich, iterativ nachgeführt; hat Vorrang vor Felgenring und Lauffläche
    ny, nz = ky, kz
    for _ in range(5):
        nb = Q[np.hypot(Q[:, 1] - ny, Q[:, 2] - nz) < 0.2 * rt]
        if len(nb) < 50:
            break
        ny, nz = nb[:, 1].mean(), nb[:, 2].mean()
    else:
        if math.hypot(ny - ky, nz - kz) > 0.012:
            print('NABE %s Abweichung %.1f mm unplausibel -> verworfen' % (key, math.hypot(ny - ky, nz - kz) * 1000))
        else:
            if math.hypot(ny - ky, nz - kz) > 0.001:
                print('NABE %s Mitte nach Nabe: %+.1f %+.1f mm gegenüber Kreisfit' % (key, (ny - ky) * 1000, (nz - kz) * 1000))
            ky, kz = ny, nz
    S = Matrix.Translation(Vector((0, c.y - ky, c.z - kz)))
    for o in teile:
        o.data.transform(S); o.data.update()
    print('MITTE %s Lauffläche lag %+.1f %+.1f mm neben der Achse -> korrigiert' % (key, (ky - c.y) * 1000, (kz - c.z) * 1000))
    return S @ T

rad_bremsen = {}
ueber_raus = []
verformt = set()
einsinken = []
if os.environ.get('RAD') == 'zyl':
    neu = {}
    zyl = {key: zylinder(key, ulo, uhi, parts) for key, (ulo, uhi, parts) in wheels.items()}
    # Materialien, deren Flächen überwiegend außerhalb aller Radzylinder liegen, sind Karosserie
    innen, gesamt = {}, {}
    for o in meshes:
        Vs = {k: verts_np(o, k) for k in zyl}; mats = [sl.material for sl in o.material_slots]
        for p in o.data.polygons:
            m = mats[p.material_index] if p.material_index < len(mats) else None
            idx = list(p.vertices)
            drin = False
            for k, z in zyl.items():
                c = Vs[k][idx].mean(axis=0)
                # großzügig: der erste Zylinder kann nur die Felge umfassen (Reifen breiter)
                if math.hypot(c[1] - z[0].y, c[2] - z[0].z) <= z[1] * 1.15 and z[2] - 0.15 <= c[0] <= z[3] + 0.15:
                    drin = True; break
            gesamt[m] = gesamt.get(m, 0) + p.area
            if drin: innen[m] = innen.get(m, 0) + p.area
    REIFEN = re.compile(r'tire|tyre|pneu|reifen|gomme|rubber', re.I)
    # Radmaterialien liegen zu ~90–100 % in den Rädern, Karosserie-Kunststoff an Radhäusern z. B. nur 40 %
    karosse = {m for m in gesamt if innen.get(m, 0) < 0.6 * gesamt[m] and not (m and REIFEN.search(m.name))}
    if os.environ.get('MATS'):
        for m in sorted(gesamt, key=lambda m: -gesamt[m])[:25]:
            print('MATANTEIL %-35s innen %.3f / gesamt %.3f m²  = %.0f %%' % ((m.name if m else '-')[-35:], innen.get(m, 0), gesamt[m], 100 * innen.get(m, 0) / max(gesamt[m], 1e-9)))
    print('KAROSSE-MATS im Rad ausgeschlossen:', sorted(m.name for m in karosse if m and innen.get(m, 0) > 0))
    for key, (ulo, uhi, parts) in wheels.items():
        cz_, r, x0, x1 = zyl[key]
        teile = schneide_rad(key, cz_, r, x0, x1, karosse)
        # Nachschneiden: Flächen mit Rad-Material (Reifen, Felge), die knapp außerhalb geblieben sind
        # (z. B. Laufflächenmantel mit größerem Radius), erweitern den Zylinder -> zweiter Schnitt
        radmats0 = {m for m in gesamt if m not in karosse and m and not STATISCH.search(m.name)}
        # Wachstumsgrenze nach dem größeren Startradius derselben Achse (ein schlecht erkanntes Rad,
        # z. B. nur Nabe, bekommt die Grenze seines Partners)
        r_start = max(r, max(z[1] for k2, z in zyl.items() if k2[1] == key[1]))
        for runde in range(3):
            rmax, xa, xb = r * 1.015, x0, x1
            dl = []; wl = []
            for o in meshes:
                if o in teile: continue
                mats = [sl.material for sl in o.material_slots]
                if not any(m in radmats0 for m in mats): continue
                V = verts_np(o, key)
                for p in o.data.polygons:
                    if p.material_index >= len(mats) or mats[p.material_index] not in radmats0: continue
                    P = V[list(p.vertices)]
                    d = np.hypot(P[:, 1] - cz_.y, P[:, 2] - cz_.z)
                    if d.max() < 1.3 * r and P[:, 0].min() > x0 - 0.08 and P[:, 0].max() < x1 + 0.08:
                        dl.append(d.max()); xa = min(xa, P[:, 0].min()); xb = max(xb, P[:, 0].max())
                        wl.append(np.degrees(np.arctan2(P[:, 2] - cz_.z, P[:, 1] - cz_.y)).mean())
            if dl:
                # robust (einzelne Ausreißer ignorieren) und höchstens +40 % gegenüber dem Start (Reifen ≈ 1,3× Felge)
                rmax = min(max(rmax, float(np.percentile(dl, 99.5))), 1.4 * r_start * 1.015)
            if rmax <= r * 1.015 + 1e-4 and xa >= x0 - 0.001 and xb <= x1 + 0.001:
                break
            print('NACHSCHNITT %s radius %.3f -> %.3f  breite %.3f -> %.3f' % (key, r, rmax / 1.015, x1 - x0, xb - xa))
            r, x0, x1 = rmax / 1.015 * 1.002, xa, xb
            # Teile aus früheren Schnitten nicht doppelt aufnehmen (sonst würden sie zweimal geradegestellt)
            teile = list(dict.fromkeys(teile + schneide_rad(key, cz_, r, x0, x1, karosse)))
        # teile = ueberstand(key, teile, cz_)   # abgeschaltet: hat bei manchen Modellen ganze Reifen entfernt
        # Bremssättel: lenken mit, drehen aber nicht (hängen später am Lenk-Drehpunkt)
        bremsen = schneide_rad(key, cz_, r, x0, x1, karosse, bremse=True)
        rad_bremsen[key] = bremsen
        if bremsen:
            print('BREMSE %s %d Teile' % (key, len(bremsen)))
        if key in rad_lenk:
            yaw, c0 = rad_lenk[key]
            M = Matrix.Translation(c0) @ Matrix.Rotation(-yaw, 4, 'Z') @ Matrix.Translation(-c0)
            for o in teile + bremsen:
                o.data.transform(M); o.data.update()
            del rad_lenk[key]
        # Halbteile/Sättel erst nach dem Geradestellen prüfen (sonst schräge Koordinaten bei eingelenkten Rädern)
        bremsen += halbe_teile(key, teile, cz_, r, x0, x1)
        if os.environ.get('TEILE'):
            for o in teile:
                V = verts_np(o); d = np.hypot(V[:, 1] - cz_.y, V[:, 2] - cz_.z)
                aussen = V[d > 0.85 * d.max()]
                if len(aussen) > 10:
                    ky, kz, kr = kreis_fit(aussen[:, 1], aussen[:, 2])
                    Pc = V - V.mean(axis=0); ax = np.linalg.eigh(np.cov(Pc.T))[1][:, 0]
                    print('TEIL %s %-28s v %5d  mitte dy %+.1f dz %+.1f mm  r %.3f  x %.3f..%.3f  achse-yaw %.1f°' % (key, o.name[:28], len(V), (ky - cz_.y) * 1000, (kz - cz_.z) * 1000, kr, V[:, 0].min(), V[:, 0].max(), math.degrees(math.atan2(ax[1], ax[0])) % 180))
        T = achse_optimieren(key, teile, Vector(((x0 + x1) / 2, cz_.y, cz_.z)), r)
        if os.environ.get('INSELN') and key == eval(os.environ['INSELN']):
            # zusammenhängende Einzelteile des Rads: Winkelabdeckung um die Achse, Radiusbereich, Material
            for o in teile:
                bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
                gesehen = set(); mats = [sl.material.name if sl.material else '-' for sl in o.material_slots]
                for v0 in bm.verts:
                    if v0.index in gesehen: continue
                    stapel = [v0]; insel = []
                    gesehen.add(v0.index)
                    while stapel:
                        v = stapel.pop(); insel.append(v)
                        for e in v.link_edges:
                            w = e.other_vert(v)
                            if w.index not in gesehen:
                                gesehen.add(w.index); stapel.append(w)
                    if len(insel) < 30: continue
                    P = np.array([tuple(v.co) for v in insel])
                    d = np.hypot(P[:, 1] - cz_.y, P[:, 2] - cz_.z)
                    ang = (np.degrees(np.arctan2(P[:, 2] - cz_.z, P[:, 1] - cz_.y)) // 10).astype(int)
                    abdeckung = len(set(ang.tolist())) * 10
                    mf = insel[0].link_faces[0].material_index if insel[0].link_faces else 0
                    print('INSEL v %5d  radius %.2f..%.2f r  winkel %3d°  x %.3f..%.3f  %s' % (len(insel), d.min() / r, d.max() / r, abdeckung, P[:, 0].min(), P[:, 0].max(), mats[mf][-30:] if mf < len(mats) else '-'))
                bm.free()
        for o in bremsen:
            o.data.transform(T); o.data.update()
        if key in verformt:
            # verformt modellierter Reifen (Lastverformung) hüpft beim Drehen: Originalreifen entfernen
            # (alle Flächen außerhalb des Felgenhorns) und durch einen generierten runden Reifen ersetzen
            teile = neuer_reifen(key, teile, cz_, x0, x1)
        pruefe(key, cz_, r, x0, x1, teile)
        if os.environ.get('TEILE'):
            # Kreismitte je Material (äußerer Rand) relativ zur Drehachse
            jm = {}
            for o in teile:
                V = verts_np(o); mats = [sl.material for sl in o.material_slots]
                for pg in o.data.polygons:
                    mn = mats[pg.material_index].name if pg.material_index < len(mats) and mats[pg.material_index] else '-'
                    jm.setdefault(mn, []).extend(pg.vertices[:] and [tuple(V[i]) for i in pg.vertices])
            for mn, pts in jm.items():
                A = np.array(pts); d = np.hypot(A[:, 1] - cz_.y, A[:, 2] - cz_.z); A = A[d > 0.9 * d.max()]
                if len(A) > 12:
                    ky, kz, kr = kreis_fit(A[:, 1], A[:, 2])
                    print('MAT %s %-40s mitte dy %+.1f dz %+.1f mm r %.3f' % (key, mn[-40:], (ky - cz_.y) * 1000, (kz - cz_.z) * 1000, kr))
        neu[key] = (Vector((x0, cz_.y - r, cz_.z - r)), Vector((x1, cz_.y + r, cz_.z + r)), teile)
    wheels = neu
    # generierte runde Reifen würden im Boden stecken (Modell war „in die Reifen gedrückt“): ganzes Auto anheben
    hub = max(einsinken, default=0)
    if hub > 0.001:
        H = Matrix.Translation(Vector((0, 0, hub)))
        for o in meshes:
            o.data.transform(H); o.data.update()
        wheels = {k: (lo + Vector((0, 0, hub)), hi + Vector((0, 0, hub)), t) for k, (lo, hi, t) in wheels.items()}
        print('ANHEBEN Auto um %.1f mm, damit die neuen Reifen auf dem Boden stehen' % (hub * 1000))
    # Vergessen-Test: jede Fläche eines Rad-Materials (Reifen, Felge …) muss in einem Rad gelandet sein
    radteile = {o for (_, _, t) in wheels.values() for o in t} | {o for b in rad_bremsen.values() for o in b} | set(ueber_raus)
    radmats = {m for m in gesamt if m not in karosse and m and not STATISCH.search(m.name)}
    vergessen = 0; fl = 0.0; je_mat = {}
    for o in meshes:
        if o in radteile: continue
        mats = [sl.material for sl in o.material_slots]
        V = verts_np(o)
        for p in o.data.polygons:
            if p.material_index < len(mats) and mats[p.material_index] in radmats:
                m = mats[p.material_index]; c = V[list(p.vertices)].mean(axis=0)
                vergessen += 1; fl += p.area
                e = je_mat.setdefault(m.name, [0, 0.0, c]); e[0] += 1; e[1] += p.area
    print('VERGESSEN %d Flächen (%.4f m²) mit Rad-Material außerhalb der Räder' % (vergessen, fl))
    for n, (k, a, c) in sorted(je_mat.items(), key=lambda x: -x[1][1])[:6]:
        print('VERGESSEN   %-30s %5d Flächen %.4f m²  z.B. bei x %.2f y %.2f z %.2f' % (n, k, a, c[0], c[1], c[2]))

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
    for o in rad_bremsen.get((sx, sy), []):
        in_wheel.add(o)
        o.parent = steer
        o.matrix_parent_inverse = steer.matrix_world.inverted()
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

gruppen = [body] + [o for o in bpy.data.objects if o.name.startswith('wheel_')]
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
