"""Faerbt den KayKit-Mage-Atlas fuer die rothaarige Figur um.

KayKit texturiert ueber einen Atlas aus Farbfeldern (32 x 32 Raster). Haar
und Stiefel bekommen ihre Felder direkt zugewiesen, Robe und Umhang laufen
ueber den Farbton — so bleiben Haut, Augen und Metall unberuehrt.
"""
import colorsys
from PIL import Image

GRID = 32
HAIR_CELLS  = (4, 7, 1, 7)                   # u von/bis, v von/bis (Raster)
BOOT_CELLS  = (13, 15, 17, 24)
HUE_RULES = [                                 # (von, bis, ziel-h, ziel-s, l-faktor)
    (.66, .84, 28/360, .40, 1.05),           # violette Robe -> braun
    (.86, .97, 128/360, .48, 1.00),          # magenta Umhang -> gruen
]

im = Image.open('mage_texture.png').convert('RGB')
w, h = im.size
px = im.load()
cw, ch = w / GRID, h / GRID


def cell_box(c):
    u0, u1, v0, v1 = c
    return (int(u0*cw), int(v0*ch), int(u1*cw), int(v1*ch))


def paint(box, fn):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = px[x, y]
            out = fn(*colorsys.rgb_to_hls(r/255, g/255, b/255))
            if out is None:
                continue
            nh, nl, ns = out
            nr, ng, nb = colorsys.hls_to_rgb(nh, nl, ns)
            px[x, y] = (round(nr*255), round(ng*255), round(nb*255))


# Haar: schwarz traegt kaum Helligkeit, deshalb aufhellen — sonst bleibt es
# eine schwarze Flaeche. Die Schattierung des Feldes bleibt erhalten.
paint(cell_box(HAIR_CELLS),
      lambda hh, l, s: None if l > .42 else (18/360, min(.62, .13 + l*2.1), .74))

# Stiefel samt Schnalle deutlich abdunkeln
paint(cell_box(BOOT_CELLS),
      lambda hh, l, s: (24/360, max(.06, l*.42), .46))

# Kleidung ueber den Farbton
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        hh, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        if s < .12:
            continue
        for lo, hi, th, ts, lf in HUE_RULES:
            if lo <= hh <= hi:
                nr, ng, nb = colorsys.hls_to_rgb(th, min(.85, l*lf), ts)
                px[x, y] = (round(nr*255), round(ng*255), round(nb*255))
                break

im.save('girl_texture.png')
print('geschrieben: girl_texture.png')
