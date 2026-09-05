"""Baut aus dem KayKit-Mage die rothaarige Figur als eigene .glb.

Aufruf:
  Blender --background --python build_girl.py

Der Hut faellt weg, die Textur wird durch die umgefaerbte ersetzt, Objekte
und Material bekommen eigene Namen. Geometrie und Rig bleiben unveraendert,
damit alle Animationen der Rig-Medium-Bibliothek weiter passen.
"""
import bpy, os

SRC = "/Users/markusstuhr/markus-stuhr.github.io/assets/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb"
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "girl_texture.png")
OUT_DIR = "/Users/markusstuhr/markus-stuhr.github.io/assets/models/Custom_Characters/Characters/gltf"
OUT = os.path.join(OUT_DIR, "Redhead_Adventurer.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)

# Hut entfernen
for name in list(bpy.data.objects.keys()):
    if name.endswith("_Hat"):
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

# Umgefaerbte Textur einsetzen: das eingebettete Bild laesst sich nicht
# einfach ueberschreiben, deshalb ein neues laden und im Bildknoten des
# Materials austauschen.
new_img = bpy.data.images.load(TEX)
new_img.name = "redhead_texture"
swapped = 0
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    for node in m.node_tree.nodes:
        if node.type == 'TEX_IMAGE':
            node.image = new_img
            swapped += 1
new_img.pack()                               # ins .glb einbetten
print("Bildknoten ersetzt:", swapped)

for m in bpy.data.materials:
    m.name = "redhead"

def lengthen_hair(extra=0.45):
    """Zieht die hinteren Haarflaechen nach unten.

    Haar-Vertices werden ueber das Haarfeld im UV-Atlas erkannt (Blender
    spiegelt v gegenueber glTF). Je tiefer und je weiter hinten ein Vertex
    liegt, desto staerker wandert er nach unten — dadurch werden die
    Straehnen laenger, statt dass die Kappe verrutscht.
    """
    ob = bpy.data.objects.get("Mage_Head")
    me = ob.data
    uv = me.uv_layers.active.data
    hair = set()
    for poly in me.polygons:
        for li in poly.loop_indices:
            u, v = uv[li].uv
            if 4/32 <= u <= 7/32 and 1 - 7/32 <= v <= 1 - 1/32:
                hair.add(me.loops[li].vertex_index)

    Z_START, Z_END = 1.58, 1.20               # ab hier wirkt es, hier voll
    moved = 0
    for i in hair:
        co = me.vertices[i].co
        back = min(1.0, max(0.0, (co.y + 0.02) / 0.22))   # 0 vorn .. 1 hinten
        depth = min(1.0, max(0.0, (Z_START - co.z) / (Z_START - Z_END)))
        w = back * depth * depth
        if w <= 0.001:
            continue
        co.z -= extra * w
        moved += 1
    me.update()
    print("Haar verlaengert, Vertices bewegt:", moved)


lengthen_hair()

# Objekte umbenennen: Mage_Body -> Redhead_Body usw.
for o in bpy.data.objects:
    if o.name.startswith("Mage_"):
        o.name = "Redhead_" + o.name.split("_", 1)[1]

os.makedirs(OUT_DIR, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_yup=True,
    export_animations=False,
    export_skins=True,
    export_apply=False,
)
print("EXPORT:", OUT, os.path.getsize(OUT), "bytes")
