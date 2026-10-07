"""Lädt den kompletten Bundeshaushalt von bundeshaushalt.de (internalapi) als Baum.
Ausgabe: data/<jahr>-<account>-<quota>-<unit>.json  (verschachtelt: label, value, children)"""
import json, os, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

API = "https://www.bundeshaushalt.de/internalapi/budgetData"
OUT = os.path.join(os.path.dirname(__file__), "data")

def get(params, tries=4):
    url = API + "?" + "&".join(f"{k}={v}" for k, v in params.items())
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(2 ** i)
        except Exception:
            time.sleep(2 ** i)
    raise RuntimeError(url)

def node(c):
    return {"id": c["id"], "nr": c.get("budgetNumber"), "label": c["label"], "value": c["value"]}

def fill(base, n):
    d = get({**base, "id": n["id"]})
    if d and d.get("children"):
        n["children"] = [node(c) for c in d["children"]]
        return n["children"]
    return []

def run(year, account, quota, unit, pool):
    f = os.path.join(OUT, f"{year}-{account}-{quota}-{unit}.json")
    if os.path.exists(f): return "skip"
    base = {"year": year, "account": account, "quota": quota, "unit": unit}
    d = get(base)
    if not d: return "404"
    root = {"label": d["detail"]["label"], "value": d["detail"]["value"],
            "meta": d["meta"], "children": [node(c) for c in d["children"]]}
    level, frontier = 1, root["children"]
    while frontier and level < d["meta"]["levelMax"]:
        frontier = [c for kids in pool.map(lambda n: fill(base, n), frontier) for c in kids]
        level += 1
    json.dump(root, open(f, "w"), ensure_ascii=False, separators=(",", ":"))
    return "ok"

if __name__ == "__main__":
    years = range(2012, 2028)
    with ThreadPoolExecutor(6) as pool:
        for y in years:
            for a in ("expenses", "income"):
                for q in ("target", "actual"):
                    for u in ("single", "function", "group"):
                        t = time.time()
                        print(y, a, q, u, run(y, a, q, u, pool), f"{time.time()-t:.0f}s", flush=True)
