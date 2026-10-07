"""Verdichtet die Rohdaten aus data/ (scrape.py) zu Web-Dateien in web/.

web/story.json          Kennzahlen pro Jahr für die Story-Seite
web/tree/<j>-<a>-<q>-<u>.json   kompakter Baum je Jahr/Konto/Soll-Ist/Sicht für den Explorer
web/titles.json         alle Titel (Ministeriumssicht) mit Zeitreihe für Suche/Vergleich
"""
import json, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
RAW, WEB = os.path.join(HERE, "data"), os.path.join(HERE, "web")
YEARS = list(range(2012, 2028))
QUOTAS = ("target", "actual")

# Einwohner Deutschland (Jahresdurchschnitt, Mio., Destatis; ab 2022 Zensus-2022-Basis, 2026/27 geschätzt)
POP = {2012: 80.4, 2013: 80.6, 2014: 81.0, 2015: 81.7, 2016: 82.3, 2017: 82.7, 2018: 82.9,
       2019: 83.1, 2020: 83.2, 2021: 83.2, 2022: 83.1, 2023: 83.4, 2024: 83.5, 2025: 83.5,
       2026: 83.5, 2027: 83.4}

# Lesbare Ausgaben-Kategorien aus der Funktionssicht (Ebene 2)
CATS = [
    ("rente", "Rente & Sozialversicherung", ["F-22"]),
    ("arbeit", "Arbeitsmarkt & Bürgergeld", ["F-25"]),
    ("sozial", "Familie & weitere Sozialleistungen", ["F-21", "F-23", "F-24", "F-26", "F-27", "F-28", "F-29"]),
    ("verteidigung", "Verteidigung", ["F-03"]),
    ("zinsen", "Zinsen & Schulden", ["F-83"]),
    ("verkehr", "Verkehr & Digitales", ["F-7"]),
    ("bildung", "Bildung & Forschung", ["F-1"]),
    ("wirtschaft", "Energie & Wirtschaft", ["F-6"]),
    ("staat", "Verwaltung, Außen & Sicherheit", ["F-0"]),  # ohne F-03 (s.u.)
    ("gesundheit", "Gesundheit & Umwelt", ["F-3"]),
    ("rest", "Wohnen, Landwirtschaft & Sonstiges", ["F-4", "F-5", "F-8"]),  # ohne F-83
]


def load(y, a, q, u):
    f = os.path.join(RAW, f"{y}-{a}-{q}-{u}.json")
    return json.load(open(f)) if os.path.exists(f) else None


def index(root):
    out = {}
    def walk(n):
        if "id" in n: out[n["id"]] = n
        for c in n.get("children", []): walk(c)
    walk(root)
    return out


def bn(v): return round(v / 1e9, 3)


def short(label):
    # "1101 681 12 Bürgergeld" -> "Bürgergeld"; "22 Sozialversicherung" -> "Sozialversicherung"
    parts = label.split(" ")
    while parts and parts[0].isdigit(): parts.pop(0)
    return " ".join(parts) or label


def compact(n):
    c = [n.get("id", ""), short(n["label"]), round(n["value"])]
    if n.get("children"): c.append([compact(k) for k in n["children"]])
    return c


def story():
    res = {"years": YEARS, "pop": POP, "cats": [{"key": k, "label": l} for k, l, _ in CATS], "data": {}}
    for y in YEARS:
        yd = {}
        for q in QUOTAS:
            f = load(y, "expenses", q, "function")
            if not f: continue
            ix = index(f)
            val = lambda i: ix[i]["value"] if i in ix else 0
            cats = {}
            for k, _, ids in CATS:
                v = sum(val(i) for i in ids)
                if k == "staat": v -= val("F-03")
                if y == 2012:  # alter Funktionenplan: 92 = Schulden, 83 = Verkehrsunternehmen (Bahn), 9 = Allg. Finanzwirtschaft
                    if k == "zinsen": v = val("F-92")
                    if k == "verkehr": v += val("F-83")
                    if k == "rest": v += val("F-9") - val("F-92") - val("F-83")
                elif k == "rest": v -= val("F-83")
                cats[k] = bn(v)
            inc = index(load(y, "income", q, "group"))
            iv = lambda i: inc[i]["value"] if i in inc else 0
            g = load(y, "expenses", q, "group"); gi = index(g)
            gv = lambda i: gi[i]["value"] if i in gi else 0
            yd[q] = {
                "total": bn(f["value"]), "cats": cats,
                "steuern": bn(iv("G-0")), "kredite": bn(iv("G-32")),
                "einnahmen": bn(load(y, "income", q, "group")["value"]),
                "personal": bn(gv("G-4")), "investitionen": bn(gv("G-7") + gv("G-8")),
                "zinsen": bn(gv("G-57")),
            }
        res["data"][y] = yd
    # Größte Einzeltitel (Soll des neuesten Jahres) für die Story
    s = load(YEARS[-2], "expenses", "target", "single")
    leaves = []
    def walk(n):
        if n.get("children"): [walk(c) for c in n["children"]]
        elif "id" in n: leaves.append(n)
    walk(s)
    leaves.sort(key=lambda n: -n["value"])
    res["topTitles"] = [{"label": short(n["label"]), "nr": n["nr"], "value": bn(n["value"])} for n in leaves[:15]]
    res["topYear"] = YEARS[-2]
    # Treemap-Baum für die Story: Funktion, 3 Ebenen, kleines Zeug zusammenfassen
    f = load(YEARS[-2], "expenses", "target", "function")
    def prune(n, depth):
        out = {"name": short(n["label"]), "value": bn(n["value"])}
        if depth < 3 and n.get("children"):
            kids = sorted(n["children"], key=lambda c: -c["value"])
            big = [k for k in kids if k["value"] > 0.4e9][:12]
            restv = sum(k["value"] for k in kids if k not in big)
            out["children"] = [prune(k, depth + 1) for k in big]
            if restv > 0.05e9: out["children"].append({"name": "Weiteres", "value": bn(restv)})
            out.pop("value")
        return out
    res["tree"] = prune(f, 0)
    return res


def titles():
    """Zeitreihe je Titel (Ministeriumssicht, Ebene Titel), Schlüssel = Haushaltsstelle ohne Funktionskennziffer."""
    t = {}
    for a in ("expenses", "income"):
        for yi, y in enumerate(YEARS):
            for qi, q in enumerate(QUOTAS):
                r = load(y, a, q, "single")
                if not r: continue
                def walk(n, path):
                    if n.get("children"):
                        for c in n["children"]: walk(c, path + [short(n["label"])] if "id" in n else path)
                    elif "id" in n:
                        key = a[0] + n["id"]
                        e = t.setdefault(key, {"a": a[0], "nr": n["nr"].split(" - ")[0], "l": short(n["label"]),
                                               "p": path, "v": [[None] * len(YEARS), [None] * len(YEARS)]})
                        e["l"], e["p"] = short(n["label"]), path  # neuester Name gewinnt
                        e["v"][qi][yi] = round(n["value"] / 1e3)  # in Tsd. €
                walk(r, [])
    return {"years": YEARS, "items": list(t.values())}


if __name__ == "__main__":
    os.makedirs(os.path.join(WEB, "tree"), exist_ok=True)
    json.dump(story(), open(os.path.join(WEB, "story.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    n = 0
    for f in sorted(glob.glob(os.path.join(RAW, "*.json"))):
        r = json.load(open(f))
        out = {"meta": {"modified": r["meta"]["modifyDate"]}, "total": round(r["value"]),
               "children": [compact(c) for c in r["children"]]}
        json.dump(out, open(os.path.join(WEB, "tree", os.path.basename(f)), "w"), ensure_ascii=False, separators=(",", ":"))
        n += 1
    json.dump(titles(), open(os.path.join(WEB, "titles.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print(n, "Bäume geschrieben")
