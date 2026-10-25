# Baut den Jockey mit MPFB (MakeHuman für Blender) und exportiert horse/jockey.glb.
# Aufruf: Blender --background --python build_jockey.py -- <sysassets> <silks.png> <out.glb>
import bpy, sys, os, math
ASSETS, SILKS, OUT = sys.argv[sys.argv.index('--') + 1:]
from bl_ext.user_default.mpfb.services.humanservice import HumanService

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# Jockeys sind klein und drahtig
macro = {'gender': 1.0, 'age': 0.42, 'muscle': 0.62, 'weight': 0.3, 'proportions': 0.6,
         'height': 0.12, 'cupsize': 0.5, 'firmness': 0.5,
         'race': {'asian': 0.1, 'caucasian': 0.8, 'african': 0.1}}
body = HumanService.create_human(macro_detail_dict=macro)
HumanService.add_builtin_rig(body, 'mixamo')
HumanService.set_character_skin(os.path.join(ASSETS, 'skins/young_caucasian_male/young_caucasian_male.mhmat'), body, skin_type='GAMEENGINE')
def clothe(rel, kind='Clothes'):
    return HumanService.add_mhclo_asset(os.path.join(ASSETS, rel), body, asset_type=kind, subdiv_levels=0)
clothe('eyes/low-poly/low-poly.mhclo', 'Eyes')
clothe('eyebrows/eyebrow001/eyebrow001.mhclo', 'Eyebrows')
suit = clothe('clothes/male_casualsuit02/male_casualsuit02.mhclo')
clothe('clothes/shoes03/shoes03.mhclo')

# Anzugtextur gegen die Rennfarben tauschen
silks = bpy.data.images.load(SILKS)
for slot in suit.material_slots:
    for n in slot.material.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and 'diffuse' in n.image.name:
            n.image = silks

arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]

# Schädel vermessen: Vertices, die überwiegend am Kopfknochen hängen und über den Augenbrauen liegen
from mathutils import Vector
gi = body.vertex_groups['mixamorig:Head'].index
# ausgewertetes Mesh nehmen: die MakeHuman-Körperform steckt in Shape Keys, nicht in den Grundvertices
basis = body.data.vertices
dg = bpy.context.evaluated_depsgraph_get()
em = body.evaluated_get(dg).to_mesh()
pts = [body.matrix_world @ em.vertices[i].co for i, v in enumerate(basis)
       if i < len(em.vertices) and any(g.group == gi and g.weight > 0.6 for g in v.groups)]
brow = max(p.z for p in pts) - 0.11
skull = [p for p in pts if p.z > brow]
lo = Vector((min(p.x for p in skull), min(p.y for p in skull), min(p.z for p in skull)))
hi = Vector((max(p.x for p in skull), max(p.y for p in skull), max(p.z for p in skull)))
c = (lo + hi) / 2
half = (hi - lo) / 2
print('SKULL', [round(x, 3) for x in c], [round(x, 3) for x in half])

def mat(name, rgb, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    return m
cap = mat('Cap', (0.98, 0.62, 0.05), 0.45)

# Reithelm: Kugelschale, die den Schädel umschließt; unten an der Brauenlinie abgeschnitten,
# hinten etwas tiefer, damit der Hinterkopf bedeckt ist
bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=1)
helmet = bpy.context.object; helmet.name = 'Helmet'
import bmesh
bm = bmesh.new(); bm.from_mesh(helmet.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < (-0.05 if v.co.y < 0 else -0.45)], context='VERTS')
bm.to_mesh(helmet.data); bm.free()
helmet.data.materials.append(cap)
bpy.ops.object.shade_smooth()
# Kugel auf die Schädelbox, mit 2 cm Polsterung; die Kappe sitzt ab der Brauenlinie
r = half + Vector((0.02, 0.02, 0.02))
helmet.scale = (r.x, r.y, r.z * 1.5)
helmet.location = (c.x, c.y, brow + 0.005)
# Schirm vorn an der Brauenlinie (vorn ist -Y in Blender)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=1, depth=0.008, end_fill_type='NGON')
peak = bpy.context.object; peak.name = 'Peak'
peak.data.materials.append(cap)
for v in peak.data.vertices:
    if v.co.y > 0.05:
        v.co.y = 0.05
peak.scale = (r.x * 0.75, 0.07, 1)
peak.location = (c.x, lo.y - 0.01, brow + 0.012)
peak.rotation_euler = (math.radians(-10), 0, 0)
for o in (helmet, peak):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    wm = o.matrix_world.copy()
    o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = 'mixamorig:Head'
    o.matrix_world = wm

# Texturen verkleinern, damit die Datei handlich bleibt
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True,
                          export_draco_mesh_compression_enable=True, export_animations=False,
                          export_image_format='JPEG', export_jpeg_quality=85)
print('JOCKEY OK', [o.name for o in bpy.data.objects])
