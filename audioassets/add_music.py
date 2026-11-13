#!/usr/bin/env python3
"""Fügt einen Musiktrack zu audioassets/music/ + music.json hinzu.

Aufruf: python3 -I add_music.py <datei> "<Titel>" "<Autor>" "<Quell-URL>" "<Kategorie>"
Braucht ffmpeg. Legt OGG + MP3 ab und berechnet die Wellenform-Peaks.
Ein Track mit gleicher id wird ersetzt. Nur CC0-Musik aufnehmen.
"""
import json, re, subprocess, sys, struct
from pathlib import Path

src, title, author, url, cat = sys.argv[1:6]
OUT = Path(__file__).resolve().parent
DIR = OUT / "music"
MAN = OUT / "music.json"
PEAKS = 48

sid = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
DIR.mkdir(exist_ok=True)
ogg, mp3 = DIR / f"{sid}.ogg", DIR / f"{sid}.mp3"
q = dict(stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
subprocess.run(["ffmpeg", "-y", "-i", src, "-c:a", "vorbis", "-strict", "-2", "-ac", "2", "-q:a", "4", str(ogg)], **q)
if src.lower().endswith(".mp3"):
    mp3.write_bytes(Path(src).read_bytes())
else:
    subprocess.run(["ffmpeg", "-y", "-i", src, "-c:a", "libmp3lame", "-q:a", "4", str(mp3)], **q)

raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(ogg), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
n = len(raw) // 2
s = struct.unpack(f"<{n}h", raw[:n * 2])
step = max(1, n // PEAKS)
pk = [max((abs(v) for v in s[i * step:(i + 1) * step]), default=0) for i in range(PEAKS)]
top = max(pk) or 1

item = {
    "id": "music-" + sid, "name": title, "pack": "music-" + re.sub(r"[^a-z0-9]+", "-", author.lower()),
    "packLabel": author, "cat": cat, "group": "", "dur": round(n / 8000, 2),
    "ogg": f"music/{sid}.ogg", "mp3": f"music/{sid}.mp3", "kb": round(mp3.stat().st_size / 1024),
    "peaks": [round(v / top * 99) for v in pk], "author": author, "license": "CC0", "source": url,
}
data = json.loads(MAN.read_text()) if MAN.exists() else {"music": []}
data["music"] = [m for m in data["music"] if m["id"] != item["id"]] + [item]
MAN.write_text(json.dumps(data, ensure_ascii=False, indent=1))
print(item["id"], item["dur"], "s")
