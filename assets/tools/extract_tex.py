import json, struct, io
from PIL import Image
src = "/Users/markusstuhr/markus-stuhr.github.io/assets/models/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb"
b = open(src, 'rb').read()
jlen = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20+jlen])
bin_off = 20 + jlen + 8                      # nach dem BIN-Chunk-Header
img = j['images'][0]
bv = j['bufferViews'][img['bufferView']]
start = bin_off + bv.get('byteOffset', 0)
data = b[start:start+bv['byteLength']]
im = Image.open(io.BytesIO(data)).convert('RGB')
im.save('mage_texture.png')
print(img.get('name'), im.size, im.mode)
