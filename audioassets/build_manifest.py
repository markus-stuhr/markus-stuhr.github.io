#!/usr/bin/env python3
"""Baut audioassets/sounds/ + manifest.json aus entpackten Quell-Packs.

Aufruf: python3 -I build_manifest.py <quellordner>
<quellordner> enthält je Pack einen Unterordner (Kenney-Packs + junkala).
Braucht ffmpeg. Jeder Sound wird als OGG (Vorbis) und MP3 abgelegt,
dazu 48 Wellenform-Peaks fürs Vorschaubild.
"""
import json, os, re, subprocess, sys, struct
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent
SND = OUT / "sounds"
PEAKS = 48

KENNEY = "https://kenney.nl/assets/"
PACKS = {
    "casino-audio":     ("Kenney · Casino Audio", "Casino & Karten", KENNEY + "casino-audio"),
    "digital-audio":    ("Kenney · Digital Audio", "Sci-Fi & Digital", KENNEY + "digital-audio"),
    "impact-sounds":    ("Kenney · Impact Sounds", "Aufprall & Schritte", KENNEY + "impact-sounds"),
    "interface-sounds": ("Kenney · Interface Sounds", "UI & Menü", KENNEY + "interface-sounds"),
    "music-jingles":    ("Kenney · Music Jingles", "Musik & Jingles", KENNEY + "music-jingles"),
    "rpg-audio":        ("Kenney · RPG Audio", "RPG & Fantasy", KENNEY + "rpg-audio"),
    "sci-fi-sounds":    ("Kenney · Sci-Fi Sounds", "Sci-Fi & Digital", KENNEY + "sci-fi-sounds"),
    "ui-audio":         ("Kenney · UI Audio", "UI & Menü", KENNEY + "ui-audio"),
    "voiceover-pack":   ("Kenney · Voiceover Pack", "Stimmen", KENNEY + "voiceover-pack"),
    "voiceover-pack-fighter": ("Kenney · Voiceover Fighter", "Stimmen", KENNEY + "voiceover-pack-fighter"),
    "junkala":          ("Juhani Junkala · 512 Retro Sounds", "Retro 8-Bit",
                         "https://opengameart.org/content/512-sound-effects-8-bit-style"),
}
AUTHOR = {"junkala": "Juhani Junkala"}

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def run(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def analyse(path):
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(path), "-ac", "1", "-ar", "8000",
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    n = len(raw) // 2
    s = struct.unpack(f"<{n}h", raw[:n * 2]) if n else (0,)
    step = max(1, len(s) // PEAKS)
    pk = [max((abs(v) for v in s[i * step:(i + 1) * step]), default=0) for i in range(PEAKS)]
    top = max(pk) or 1
    return round(n / 8000, 2), [round(v / top * 99) for v in pk]

items = []
for pack, (label, cat, url) in PACKS.items():
    root = SRC / pack
    files = sorted(p for p in root.rglob("*") if p.suffix.lower() in (".ogg", ".wav"))
    for f in files:
        rel = f.relative_to(root)
        sub = [x for x in rel.parts[:-1] if not x.startswith("The Essential") and x != "Audio"]
        name = f.stem
        sid = slug(pack + "-" + "-".join(sub) + "-" + name)
        dst = SND / pack / sid
        ogg, mp3 = dst.with_suffix(".ogg"), dst.with_suffix(".mp3")
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not ogg.exists():
            if f.suffix.lower() == ".ogg":
                ogg.write_bytes(f.read_bytes())
            else:
                run("ffmpeg", "-y", "-i", str(f), "-c:a", "vorbis", "-strict", "-2", "-ac", "2", "-q:a", "4", str(ogg))
        if not mp3.exists():
            run("ffmpeg", "-y", "-i", str(ogg), "-c:a", "libmp3lame", "-q:a", "5", str(mp3))
        dur, pk = analyse(ogg)
        items.append({
            "id": sid, "name": name.replace("_", " "), "pack": pack, "packLabel": label,
            "cat": cat, "group": " / ".join(sub), "dur": dur,
            "ogg": f"sounds/{pack}/{sid}.ogg", "mp3": f"sounds/{pack}/{sid}.mp3",
            "kb": round((ogg.stat().st_size) / 1024), "peaks": pk,
            "author": AUTHOR.get(pack, "Kenney"), "license": "CC0", "source": url,
        })
    print(pack, len(files))

(OUT / "manifest.json").write_text(json.dumps({"sounds": items}, ensure_ascii=False, separators=(",", ":")))
print("total", len(items))
