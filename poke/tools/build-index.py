#!/usr/bin/env python3
"""
Baut die Suchindizes für den Kartenbaum.

Warum überhaupt ein eigener Index: TCGdex liefert unter /v2/{lang}/cards zwar
alle Karten, aber unkomprimiert — 1,8 MB für Deutsch. Derselbe Bestand kompakt
umgeschichtet sind ~460 KB, die GitHub Pages auf ~126 KB gzippt. Faktor 14, und
die Suche funktioniert danach offline und ohne Roundtrip.

Zusätzlich wird je Karte festgehalten, **woher ihr Bild kommt**. Sonst müsste
der Browser raten und liefe in fehlschlagende Requests:

    0  Bild in der Zielsprache      assets.tcgdex.net/{lang}/…
    1  nur englischer Scan          assets.tcgdex.net/en/…
    2  von pokemontcg.io            images.pokemontcg.io/{ptcgSet}/{nr}.png
    3  nirgends vorhanden           Platzhalter

Aufruf:   python3 poke/tools/build-index.py [sprache ...]
Ergebnis: poke/index/{lang}.json
"""

import json, sys, re, time, urllib.request, pathlib, datetime
from concurrent.futures import ThreadPoolExecutor

API   = 'https://api.tcgdex.net/v2'
PTCG  = 'https://api.pokemontcg.io/v2'
OUT   = pathlib.Path(__file__).resolve().parent.parent / 'index'
LANGS = ['de','en','fr','it','es','pt','ja','ko','zh-tw','zh-cn','id','th','nl','pl','ru']

UA = 'kartenbaum/1.0 (+https://markusstuhr.de/poke)'


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


def set_details(lang):
    """Alle Set-Details einer Sprache. Nur hier steht drin, welche Karte ein Bild hat."""
    sets = fetch(f'{API}/{lang}/sets')
    def one(s):
        try:    return fetch(f'{API}/{lang}/sets/{s["id"]}')
        except Exception: return None
    with ThreadPoolExecutor(8) as ex:
        return [d for d in ex.map(one, sets) if d]


def with_image(details):
    out = set()
    for d in details:
        for c in d.get('cards') or []:
            if c.get('image'):
                out.add((d['id'], c.get('localId')))
    return out


# ---- Caches über alle Sprachen hinweg, die Daten sind sprachunabhängig ----
_en_images = None
_ptcg_sets = None
_ptcg_nums = {}


def en_images():
    global _en_images
    if _en_images is None:
        _en_images = with_image(set_details('en'))
    return _en_images


def ptcg_sets():
    """Sets von pokemontcg.io, indiziert über den normalisierten Namen.

    Die API wirft sporadisch 500er. Das ist eine Zusatzquelle — wenn sie
    ausfällt, bleiben die betroffenen Karten eben ohne Bild, statt den
    ganzen Build zu killen."""
    global _ptcg_sets
    if _ptcg_sets is None:
        rows, page = [], 1
        try:
            while True:
                d = fetch(f'{PTCG}/sets?page={page}&pageSize=100', tries=6)
                rows += d['data']
                if len(d['data']) < 100:
                    break
                page += 1
        except Exception as e:
            print(f'  Warnung: pokemontcg.io nicht erreichbar ({e}) — Lücken bleiben offen',
                  file=sys.stderr)
            rows = []
        _ptcg_sets = {}
        for s in rows:
            _ptcg_sets.setdefault(norm(s['name']), s['id'])
    return _ptcg_sets


def ptcg_numbers(psid):
    """Kartennummern eines pokemontcg.io-Sets, die tatsächlich ein Bild haben."""
    if psid not in _ptcg_nums:
        try:
            cs = fetch(f'{PTCG}/cards?q=set.id:{psid}&pageSize=250&select=id,number,images')['data']
            _ptcg_nums[psid] = {c['number'] for c in cs if (c.get('images') or {}).get('small')}
        except Exception:
            _ptcg_nums[psid] = set()
        time.sleep(0.3)
    return _ptcg_nums[psid]


norm = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())


def build(lang):
    details = set_details(lang)
    own = with_image(details)
    en  = en_images()

    # Serien -> Sets, damit jede Karte ihre Serie kennt (für Bild-URL und Farbe)
    series = fetch(f'{API}/{lang}/series')
    def serie_detail(s):
        try:    return fetch(f'{API}/{lang}/series/{s["id"]}')
        except Exception: return {'id': s['id'], 'sets': []}
    with ThreadPoolExecutor(6) as ex:
        sdet = list(ex.map(serie_detail, series))

    meta = {}                       # setId -> [name, serieId, release]
    for d in sdet:
        for st in d.get('sets') or []:
            meta[st['id']] = [st.get('name') or st['id'], d['id'], st.get('releaseDate') or '']

    cards = fetch(f'{API}/{lang}/cards')

    order, rows, fehlend = {}, [], set()
    for c in cards:
        cid, lid = c.get('id') or '', c.get('localId') or ''
        cut = cid.rfind('-' + lid)
        sid = cid[:cut] if (lid and cut > 0) else cid
        if sid not in meta:
            fehlend.add(sid)
        if sid not in order:
            order[sid] = len(order)
        rows.append([order[sid], lid, c.get('name') or '', sid])

    # Waisen: POP-Serien, Trainer Kits, McDonald's — stehen in /cards, fehlen in
    # /series dieser Sprache. Auf Englisch sind sie da.
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
    for sid in fehlend:
        meta.setdefault(sid, [sid, '', ''])

    # Welche Sets haben Lücken? Nur für die lohnt der Blick zu pokemontcg.io.
    luecken = {}
    for si, lid, name, sid in rows:
        if (sid, lid) not in own and (sid, lid) not in en:
            luecken.setdefault(sid, set()).add(lid)

    # Zuordnung über den *englischen* Setnamen — die IDs unterscheiden sich
    # (TCGdex "swsh12.5gg" heißt dort "swsh12pt5gg").
    en_names = {s['id']: s['name'] for s in fetch(f'{API}/en/sets')}
    ptcg_by_set = {}
    for sid in luecken:
        psid = ptcg_sets().get(norm(en_names.get(sid, '')))
        if psid and (luecken[sid] & ptcg_numbers(psid)):
            ptcg_by_set[sid] = psid

    # Quelle je Karte festschreiben
    quelle = {0: 0, 1: 0, 2: 0, 3: 0}
    final = []
    for si, lid, name, sid in rows:
        if (sid, lid) in own:                                        src = 0
        elif (sid, lid) in en:                                       src = 1
        elif sid in ptcg_by_set and lid in ptcg_numbers(ptcg_by_set[sid]): src = 2
        else:                                                        src = 3
        quelle[src] += 1
        final.append([si, lid, name, src])

    out = {
        'lang':  lang,
        'built': datetime.date.today().isoformat(),
        'count': len(final),
        # [setId, setName, serieId, releaseDate, nurEnglischeMetadaten, ptcgSetId]
        'sets':  [[s, *meta[s], 1 if s in en_only else 0, ptcg_by_set.get(s, '')] for s in order],
        # [setIndex, localId, name, bildquelle]
        'cards': final,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f'{lang}.json'
    p.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    n = len(final) or 1
    print(f'{lang:6s} {len(final):6d} Karten  {len(order):4d} Sets  {p.stat().st_size//1024:5d} KB'
          f'   Bilder: {quelle[0]} eigen · {quelle[1]} EN · {quelle[2]} ptcg.io · {quelle[3]} keins'
          f'  ({100*(n-quelle[3])/n:.1f} % abgedeckt)')
    return len(final)


if __name__ == '__main__':
    todo = sys.argv[1:] or LANGS
    total = 0
    for l in todo:
        try:
            total += build(l)
        except Exception as e:
            print(f'{l:6s} FEHLER: {e}', file=sys.stderr)
    print(f'\n{total} Karten in {len(todo)} Sprachen -> {OUT}')
