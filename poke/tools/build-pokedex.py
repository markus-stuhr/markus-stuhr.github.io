#!/usr/bin/env python3
"""
Baut die Pokédex-Indizes für den Kartenbaum.

Quelle ist PokéAPI. Ein einziger Durchlauf über alle 1025 Species reicht:
die Antwort enthält die Namen in allen Sprachen, die Vorentwicklung
(`evolves_from_species`) und die Ketten-ID. Die Evolution-Chain-Endpoints
werden dadurch gar nicht gebraucht.

Aufruf:   python3 poke/tools/build-pokedex.py
Ergebnis: poke/pokedex/{lang}.json  (eine Datei je Sprache des Kartenbaums)
"""

import json, sys, urllib.request, urllib.error, pathlib, datetime, time
from concurrent.futures import ThreadPoolExecutor

API = 'https://pokeapi.co/api/v2'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'pokedex'

# Sprachen des Kartenbaums -> Sprachcode bei PokéAPI.
# Was PokéAPI nicht kennt (pt, id, th, nl, pl, ru), bekommt die englischen Namen.
LANGMAP = {
    'de':'de', 'en':'en', 'fr':'fr', 'it':'it', 'es':'es', 'ja':'ja',
    'ko':'ko', 'zh-tw':'zh-hant', 'zh-cn':'zh-hans',
    'pt':'en', 'id':'en', 'th':'en', 'nl':'en', 'pl':'en', 'ru':'en',
}

GEN = {f'generation-{r}': i+1 for i, r in
       enumerate(['i','ii','iii','iv','v','vi','vii','viii','ix'])}


# PokéAPI antwortet dem Python-Standard-User-Agent mit 403.
UA = 'kartenbaum/1.0 (+https://markusstuhr.de/poke)'


def fetch(url, tries=3):
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception:
            if n == tries - 1:
                raise
            time.sleep(1.5 * (n + 1))


def species(i):
    d = fetch(f'{API}/pokemon-species/{i}')
    names = {n['language']['name']: n['name'] for n in d['names']}
    parent = d.get('evolves_from_species')
    return {
        'dex':   d['id'],
        'names': names,
        'from':  int(parent['url'].rstrip('/').split('/')[-1]) if parent else 0,
        'chain': int(d['evolution_chain']['url'].rstrip('/').split('/')[-1]),
        'gen':   GEN.get(d['generation']['name'], 0),
    }


def main():
    total = fetch(f'{API}/pokemon-species?limit=1')['count']
    print(f'{total} Species werden geholt …')

    rows, fehler = [], []
    with ThreadPoolExecutor(6) as ex:
        for r in ex.map(lambda i: (i, safe(i)), range(1, total + 1)):
            i, d = r
            (rows if d else fehler).append(d or i)
            if len(rows) % 200 == 0 and d:
                print(f'  {len(rows)}/{total}')

    rows.sort(key=lambda r: r['dex'])
    if fehler:
        print(f'  {len(fehler)} Fehlschläge: {fehler[:10]}', file=sys.stderr)

    OUT.mkdir(parents=True, exist_ok=True)
    for lang, pl in LANGMAP.items():
        out = {
            'lang':  lang,
            'built': datetime.date.today().isoformat(),
            'count': len(rows),
            # [dex, name, chainId, vorentwicklungDex, generation]
            'species': [[r['dex'],
                         r['names'].get(pl) or r['names'].get('en') or f"#{r['dex']}",
                         r['chain'], r['from'], r['gen']] for r in rows],
        }
        p = OUT / f'{lang}.json'
        p.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')),
                     encoding='utf-8')
        print(f'{lang:6s} {len(rows):5d} Species  {p.stat().st_size//1024:4d} KB'
              f'{"" if pl == lang else f"  (Namen aus {pl})"}')

    ketten = len({r['chain'] for r in rows})
    print(f'\n{len(rows)} Species in {ketten} Evolutionsketten -> {OUT}')


def safe(i):
    try:    return species(i)
    except Exception: return None


if __name__ == '__main__':
    main()
