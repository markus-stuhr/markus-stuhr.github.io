#!/usr/bin/env python3
"""Skaliert ein Quellbild auf das Spielraster (320x180) und reduziert die Palette.
Usage: python3 pixelize.py <src> <out> [farben]
"""
import sys
from PIL import Image

VW, VH = 320, 180

def main():
    src = sys.argv[1]
    out = sys.argv[2]
    colors = int(sys.argv[3]) if len(sys.argv) > 3 else 64

    im = Image.open(src).convert('RGB')
    w, h = im.size

    # Auf 16:9 zuschneiden – Vordergrund (unten) behalten, mehr oben (Himmel) wegschneiden
    target_h = round(w * VH / VW)
    if target_h <= h:
        top = round((h - target_h) * 0.62)
        im = im.crop((0, top, w, top + target_h))
    else:
        target_w = round(h * VW / VH)
        left = (w - target_w) // 2
        im = im.crop((left, 0, left + target_w, h))

    small = im.resize((VW, VH), Image.LANCZOS)
    if colors > 0:
        small = small.quantize(colors=colors, method=Image.MEDIANCUT).convert('RGB')
    small.save(out)
    print('saved', out, small.size, f'({colors} Farben)')

if __name__ == '__main__':
    main()
