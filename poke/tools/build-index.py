#!/usr/bin/env python3
"""
Baut die Suchindizes für den Kartenbaum.

Warum überhaupt ein eigener Index: TCGdex liefert unter /v2/{lang}/cards zwar
alle Karten, aber unkomprimiert — 1,8 MB für Deutsch. Derselbe Bestand kompakt
umgeschichtet sind 456 KB, die GitHub Pages auf ~126 KB gzippt. Faktor 14, und
die Suche funktioniert danach offline und ohne Roundtrip.

Aufruf:   python3 poke/tools/build-index.py [sprache ...]
Ohne Argumente werden alle Sprachen gebaut.

Ergebnis: poke/index/{lang}.json
"""

import json, sys, urllib.request, pathlib, datetime
from concurrent.futures import ThreadPoolExecutor

API  = 'https://api.tcgdex.net/v2'
OUT  = pathlib.Path(__file__).resolve().parent.parent / 'index'
LANGS = ['de','en','fr','it','es','pt','ja','ko','zh-tw','zh-cn','id','th','nl','pl','ru']


def fetch(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def build(lang):
    # 1. Serien -> Sets, damit jede Karte ihre Serie kennt (für Bild-URL und Farbe)
    series = fetch(f'{API}/{lang}/series')
    def serie_detail(s):
        try:    return fetch(f'{API}/{lang}/series/{s["id"]}')
        except Exception: return {'id': s['id'], 'sets': []}
    with ThreadPoolExecutor(6) as ex:
        details = list(ex.map(serie_detail, series))

    meta = {}                       # setId -> [name, serieId, release]
    for d in details:
        for st in d.get('sets') or []:
            meta[st['id']] = [st.get('name') or st['id'], d['id'], st.get('releaseDate') or '']

    # 2. Alle Karten der Sprache
    cards = fetch(f'{API}/{lang}/cards')

    # 3. Sets durchnummerieren, damit die Set-ID nicht 20.000-mal im Text steht
    order, rows, fehlend = {}, [], set()
    for c in cards:
        cid, lid = c.get('id') or '', c.get('localId') or ''
        cut = cid.rfind('-' + lid)
        sid = cid[:cut] if (lid and cut > 0) else cid
        if sid not in meta:
            fehlend.add(sid)
        if sid not in order:
            order[sid] = len(order)
        rows.append([order[sid], lid, c.get('name') or ''])

    # 3b. Waisen: POP-Serien, Trainer Kits und McDonald's-Promos tauchen in der
    # Karten-Liste auf, fehlen aber in /series dieser Sprache. Auf Englisch sind
    # sie vorhanden — Name und Serie von dort holen, Bilder dann auch von dort.
    en_only = set()
    if fehlend and lang != 'en':
        def en_set(sid):
            try:    return sid, fetch(f'{API}/en/sets/{sid}')
            except Exception: return sid, None
        with ThreadPoolExecutor(6) as ex:
            for sid, d in ex.map(en_set, sorted(fehlend)):
                if d and d.get('name'):
                    meta[sid] = [d['name'], (d.get('serie') or {}).get('id') or '',
                                 d.get('releaseDate') or '']
                    en_only.add(sid)
                else:
                    meta[sid] = [sid, '', '']
    for sid in fehlend:
        meta.setdefault(sid, [sid, '', ''])

    out = {
        'lang':  lang,
        'built': datetime.date.today().isoformat(),
        'count': len(rows),
        # [setId, setName, serieId, releaseDate, nurEnglischeBilder]
        'sets':  [[s, *meta[s], 1 if s in en_only else 0] for s in order],
        # [setIndex, localId, name]
        'cards': rows,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f'{lang}.json'
    p.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    rest = len(fehlend) - len(en_only)
    note = ''
    if en_only: note += f'  ({len(en_only)} Sets über EN ergänzt)'
    if rest > 0: note += f'  ({rest} weiter ohne Serie)'
    print(f'{lang:6s} {len(rows):6d} Karten  {len(order):4d} Sets  {p.stat().st_size//1024:5d} KB{note}')
    return lang, len(rows)


if __name__ == '__main__':
    todo = sys.argv[1:] or LANGS
    total = 0
    for l in todo:
        try:
            total += build(l)[1]
        except Exception as e:
            print(f'{l:6s} FEHLER: {e}', file=sys.stderr)
    print(f'\n{total} Karten in {len(todo)} Sprachen -> {OUT}')
