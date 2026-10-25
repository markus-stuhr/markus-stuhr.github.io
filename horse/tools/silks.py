# Färbt die MakeHuman-Textur male_casualsuit02 zum Jockey-Outfit um:
# Oberteil = Rennjacke (Rauten), Ärmel = Ringel, Jeans = weiße Reithose.
# Falten bleiben erhalten, weil die Helligkeit des Originals einmoduliert wird.
import sys
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
H, W, _ = img.shape
lum = img.mean(axis=2)
yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W]).reshape(2, 1, 1)
GREEN = np.array([0.05, 0.36, 0.20]); GOLD = np.array([0.98, 0.78, 0.12]); WHITE = np.array([0.93, 0.92, 0.88])

out = np.zeros_like(img)
# Rumpf: Rauten
d = ((np.abs(((xx * 14) % 2) - 1) + np.abs(((yy * 14) % 2) - 1)) < 1)
body = np.where(d[..., None], GOLD, GREEN)
# Ärmel: Ringel quer zur Ärmelachse (die liegt in der Textur senkrecht)
hoops = np.where((((yy * 22) % 2) < 1)[..., None], GOLD, GREEN)
out[:] = body
sleeve = xx > 0.705
out[sleeve] = hoops[sleeve]
pants = (yy > 0.41) & (xx < 0.705)
out[pants] = WHITE

# Faltenschattierung aus dem Original übernehmen
shade = lum / np.median(lum)
shade = np.clip(0.75 + 0.25 * shade, 0.55, 1.15)[..., None]
out = np.clip(out * shade, 0, 1)
Image.fromarray((out * 255).astype(np.uint8)).save(dst)
