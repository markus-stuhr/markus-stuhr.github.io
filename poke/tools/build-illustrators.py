#!/usr/bin/env python3
"""
Baut je Sprache die Zuordnung Illustrator -> Karten.

Der Kartenindex (build-index.py) kennt keine Illustratoren — die stehen bei
TCGdex nur im Kartendetail. Es gibt aber /illustrators und je Name eine
Kartenliste; das sind ein paar hundert Requests statt 20 000.

Die Angaben sind je Sprache lückenhaft (ko kennt 119 Namen, en 412). Der
Illustrator einer Karte hängt aber nicht an der Sprache. Deshalb wird für jede
Sprache aus drei Quellen gesammelt — eigene, englische, japanische — und über
die Karten-ID (setId-localId) auf die eigenen Indexzeilen gelegt.

Schreibweisen gehen auseinander ("AKIRA EGAWA" / "Akira Egawa"). Gebündelt
wird ohne Groß-/Kleinschreibung; angezeigt die häufigste Schreibweise.

Aufruf:   python3 poke/tools/build-illustrators.py [sprache ...]
Braucht:  poke/index/{lang}.json
Ergebnis: poke/index/ill-{lang}.json   [[name, [zeile, …]], …]
"""

import json, sys, time, urllib.request, urllib.parse, pathlib, collections
from concurrent.futures import ThreadPoolExecutor

API = 'https://api.tcgdex.net/v2'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'index'
UA  = 'kartenbaum/1.0 (+https://markusstuhr.de/poke)'
LANGS = ['de','en','fr','it','es','pt','ja','ko','zh-tw','zh-cn','id','th','nl','pl','ru']


def fetch(url, tries=4):
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception:
            if n == tries - 1:
                raise
            time.sleep(1.5 * (n + 1))


_cache = {}

def karten_je_illustrator(lang):
    """Karten-ID -> Schreibweise des Illustrators, für eine Sprache."""
    if lang in _cache:
        return _cache[lang]
    try:
        names = fetch(f'{API}/{lang}/illustrators')
    except Exception:
        names = []
    def one(n):
        n = n.strip()
        if not n:
            return n, []
        try:
            return n, fetch(f'{API}/{lang}/cards?illustrator=eq:' + urllib.parse.quote(n))
        except Exception:
            return n, []
    out = {}
    with ThreadPoolExecutor(8) as ex:
        for n, cards in ex.map(one, names):
            for c in cards or []:
                out.setdefault(c['id'], n)
    _cache[lang] = out
    return out


def build(lang):
    d = json.loads((OUT / f'{lang}.json').read_text(encoding='utf-8'))
    quellen = [karten_je_illustrator(lang), karten_je_illustrator('en'), karten_je_illustrator('ja')]

    gruppen = collections.defaultdict(list)          # name.lower() -> zeilen
    schreib = collections.defaultdict(collections.Counter)
    for i, (si, lid, *_rest) in enumerate(d['cards']):
        cid = f"{d['sets'][si][0]}-{lid}"
        n = next((q[cid] for q in quellen if cid in q), None)
        if not n:
            continue
        k = ' '.join(n.lower().split())
        gruppen[k].append(i)
        schreib[k][n] += 1

    rows = [[schreib[k].most_common(1)[0][0], z] for k, z in gruppen.items()]
    rows.sort(key=lambda r: r[0].lower())
    p = OUT / f'ill-{lang}.json'
    p.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    n = sum(len(z) for _, z in rows)
    print(f'{lang:6s} {len(rows):4d} Illustratoren  {n:6d} von {len(d["cards"]):6d} Karten zugeordnet'
          f'  {p.stat().st_size//1024:4d} KB')


if __name__ == '__main__':
    for l in sys.argv[1:] or LANGS:
        try:
            build(l)
        except Exception as e:
            print(f'{l:6s} FEHLER: {e}', file=sys.stderr)
