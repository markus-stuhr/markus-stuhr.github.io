#!/usr/bin/env python3
"""Baut den Minifiguren-Katalog aus den Rebrickable-Bulk-CSVs.

Erzeugt:
  ../data/index.json        Themes + Zahlen, Metadaten
  ../data/figs-<slug>.json  Figuren pro Root-Theme
"""
import csv, json, os, re, gzip, urllib.request
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
FILES = ["minifigs", "inventory_minifigs", "inventories", "sets", "themes"]
BASE = "https://cdn.rebrickable.com/media/downloads/%s.csv.gz"


def download():
    for f in FILES:
        path = os.path.join(HERE, f + ".csv")
        print("lade", f)
        with urllib.request.urlopen(BASE % f) as r, open(path, "wb") as out:
            out.write(gzip.decompress(r.read()))


def read(name):
    with open(os.path.join(HERE, name + ".csv"), encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def slug(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-") or "other"


def build():
    themes = {t["id"]: t for t in read("themes")}

    def root(tid):
        seen = set()
        while tid in themes and themes[tid]["parent_id"] and tid not in seen:
            seen.add(tid)
            tid = themes[tid]["parent_id"]
        return tid

    def path(tid):
        out, seen = [], set()
        while tid in themes and tid not in seen:
            seen.add(tid)
            out.append(themes[tid]["name"])
            tid = themes[tid]["parent_id"]
        return " / ".join(reversed(out))

    sets = {s["set_num"]: s for s in read("sets")}
    # inventory_id -> set_num, nur die jeweils höchste Version je Set
    best = {}
    for inv in read("inventories"):
        cur = best.get(inv["set_num"])
        if not cur or int(inv["version"]) > int(cur["version"]):
            best[inv["set_num"]] = inv
    inv2set = {inv["id"]: sn for sn, inv in best.items()}

    figsets = defaultdict(list)
    for row in read("inventory_minifigs"):
        sn = inv2set.get(row["inventory_id"])
        if sn and sn in sets:
            figsets[row["fig_num"]].append(sn)

    by_theme = defaultdict(list)
    setfigs = defaultdict(list)      # set_num -> [fig_num, ...]
    stats = {"total": 0, "ohne_set": 0}
    for fig in read("minifigs"):
        stats["total"] += 1
        appear = sorted(set(figsets.get(fig["fig_num"], [])))
        entries = [sets[s] for s in appear]
        years = sorted(int(e["year"]) for e in entries if e["year"].isdigit())
        if entries:
            tid = root(entries[0]["theme_id"])
        else:
            tid = None
            stats["ohne_set"] += 1
        for sn in appear:
            setfigs[sn].append(fig["fig_num"])
        rec = {
            "id": fig["fig_num"],
            "name": fig["name"],
            "parts": int(fig["num_parts"]),
            "img": fig["img_url"],
            "year": years[0] if years else None,
            "theme": path(entries[0]["theme_id"]) if entries else None,
            "sets": [{"num": e["set_num"], "name": e["name"], "year": e["year"]} for e in entries[:12]],
            "set_count": len(entries),
        }
        by_theme[themes[tid]["name"] if tid else "Ohne Set"].append(rec)

    os.makedirs(DATA, exist_ok=True)
    for f in os.listdir(DATA):
        if f.startswith("figs-") or f in ("index.json", "search.json", "sets.json"):
            os.remove(os.path.join(DATA, f))

    index = []
    for name, figs in sorted(by_theme.items(), key=lambda kv: -len(kv[1])):
        # neueste zuerst; Figuren ohne Jahr ans Ende
        figs.sort(key=lambda f: (-(f["year"] or 0), f["name"]))
        sl = slug(name)
        with open(os.path.join(DATA, "figs-%s.json" % sl), "w", encoding="utf-8") as fh:
            json.dump(figs, fh, ensure_ascii=False, separators=(",", ":"))
        ys = [f["year"] for f in figs if f["year"]]
        index.append({"name": name, "slug": sl, "count": len(figs),
                      "from": min(ys) if ys else None, "to": max(ys) if ys else None})

    # Rückwärts-Index Set -> Figuren: {set_num: [name, jahr, [kurz-ids]]}
    setidx = {}
    for sn, figs in setfigs.items():
        e = sets[sn]
        setidx[sn] = [e["name"], e["year"], sorted(f[4:] for f in figs)]
    with open(os.path.join(DATA, "sets.json"), "w", encoding="utf-8") as fh:
        json.dump(setidx, fh, ensure_ascii=False, separators=(",", ":"))

    # kompakter Suchindex über alle Themes: [id, name, theme-slug, jahr]
    search = []
    for name, figs in by_theme.items():
        sl = slug(name)
        for f in figs:
            search.append([f["id"][4:], f["name"], sl, f["year"] or 0])
    search.sort(key=lambda r: r[1])
    with open(os.path.join(DATA, "search.json"), "w", encoding="utf-8") as fh:
        json.dump(search, fh, ensure_ascii=False, separators=(",", ":"))

    with open(os.path.join(DATA, "index.json"), "w", encoding="utf-8") as fh:
        json.dump({"source": "Rebrickable", "themes": index, "total": stats["total"]}, fh,
                  ensure_ascii=False, separators=(",", ":"))
    print("Figuren:", stats["total"], "| ohne Set:", stats["ohne_set"],
          "| Themes:", len(index), "| Sets mit Figuren:", len(setidx))


if __name__ == "__main__":
    import sys
    if "--download" in sys.argv:
        download()
    build()
