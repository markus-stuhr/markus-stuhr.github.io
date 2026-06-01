#!/usr/bin/env python3
"""
Convert the raw TracTrac GPX exports into slim JSON race files for the
sailing simulator's replay mode.

For each race it extracts:
  - the boats (name / skipper / colour) with their tracks resampled onto a
    uniform time grid (positions as [lng, lat]),
  - the course marks (single-point tracks),
  - a reconstructed wind time-series (TWD + estimated TWS).

Wind is not in the data, so it is reconstructed from fleet behaviour:
  * TWD: at every tack the boat turns *through* the wind and slows; the
    bisector of the heading before/after the tack points dead upwind. We
    collect tacks across the whole fleet, fold them onto the windward
    hemisphere and smooth over time.
  * TWS: estimated from upwind boat speed and reaching peaks (a proxy — the
    relative changes are reliable, absolute kn are approximate).

Usage:  python3 build_races.py
Reads:  ../GPS Tracks/*.gpx   (git-ignored raw data)
Writes: ../races/<slug>.json  (committed, slim)
"""
import xml.etree.ElementTree as ET
import glob, math, os, json, datetime, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
GPX_DIR = os.path.join(HERE, '..', 'GPS Tracks')
OUT_DIR = os.path.join(HERE, '..', 'races')

DT = 5            # seconds between resampled track samples
WIN = 600         # wind-estimation window (s)
WIN_STEP = 300    # wind-estimation step (s)

# Known boat colours (Performance from the Globe project; Maxis assigned)
COLORS = {
    'Ammonite 2': '#e74c3c', 'Freya': '#3498db', 'Hummingbird': '#2ecc71',
    'Galateia': '#e74c3c', 'Balthasar': '#f39c12', 'Bella Mente': '#3498db',
    'Leopard 3': '#2ecc71', 'V': '#9b59b6', 'Black Jack': '#1abc9c',
    'Deep Blue': '#e84393',
}
PALETTE = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e84393']

META = {
    'Maxi and Maxi GP Race 1':  ('Maxi & Maxi GP Race 1', 'Maxi GP',     '2026-03-20'),
    'Maxi and Maxi GP Race2':   ('Maxi & Maxi GP Race 2', 'Maxi GP',     '2026-03-21'),
    'Performance Race 1':       ('Performance Race 1',    'Performance', '2026-03-20'),
    'Performance Race2':        ('Performance Race 2',    'Performance', '2026-03-21'),
}


def slugify(s):
    return s.lower().replace('&', 'and').replace('  ', ' ').strip().replace(' ', '-')


def bearing(a, b):
    la1, lo1, la2, lo2 = map(math.radians, [a[1], a[2], b[1], b[2]])
    dlo = lo2 - lo1
    y = math.sin(dlo) * math.cos(la2)
    x = math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(dlo)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def hav_nm(a, b):
    R = 3440.065
    la1, lo1, la2, lo2 = map(math.radians, [a[1], a[2], b[1], b[2]])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))


def adiff(a, b):
    return abs((a - b + 180) % 360 - 180)


def parse(fn):
    root = ET.parse(fn).getroot()
    ns = '{' + root.tag.split('}')[0].strip('{') + '}'
    boats, marks = [], []
    for trk in root.findall('.//' + ns + 'trk'):
        nmEl = trk.find(ns + 'name')
        nm = nmEl.text if nmEl is not None else '?'
        pts = trk.findall('.//' + ns + 'trkpt')
        if len(pts) >= 500:
            arr = []
            for p in pts:
                tEl = p.find(ns + 'time')
                if tEl is None:
                    continue
                t = datetime.datetime.strptime(tEl.text, '%Y-%m-%dT%H:%M:%S.%fZ').replace(
                    tzinfo=datetime.timezone.utc).timestamp()
                arr.append((t, float(p.get('lat')), float(p.get('lon'))))
            parts = [s.strip() for s in nm.split(',')]
            skipper = parts[0] if len(parts) > 1 else ''
            boat = parts[1] if len(parts) > 1 else nm
            boats.append({'name': boat, 'skipper': skipper, 'arr': arr})
        elif len(pts) == 1:
            marks.append({'name': nm.strip(), 'lat': float(pts[0].get('lat')), 'lng': float(pts[0].get('lon'))})
    return boats, marks


def kinematics(arr, dt=12):
    out = []
    n = len(arr)
    for i in range(n):
        lo = i
        while lo > 0 and arr[i][0] - arr[lo][0] < dt:
            lo -= 1
        hi = i
        while hi < n - 1 and arr[hi][0] - arr[i][0] < dt:
            hi += 1
        if hi <= lo:
            out.append((arr[i][0], None, None))
            continue
        dth = arr[hi][0] - arr[lo][0]
        out.append((arr[i][0], bearing(arr[lo], arr[hi]),
                    hav_nm(arr[lo], arr[hi]) / (dth / 3600) if dth > 0 else 0))
    return out


def cbis(h1, h2):
    x = math.cos(math.radians(h1)) + math.cos(math.radians(h2))
    y = math.sin(math.radians(h1)) + math.sin(math.radians(h2))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def detect_tacks(K, gap=18):
    tacks = []
    n = len(K)
    i = 0
    while i < n:
        t, c, s = K[i]
        if c is None:
            i += 1
            continue
        j0 = i
        while j0 > 0 and t - K[j0][0] < gap:
            j0 -= 1
        j1 = i
        while j1 < n - 1 and K[j1][0] - t < gap:
            j1 += 1
        h1, h2 = K[j0][1], K[j1][1]
        if h1 is None or h2 is None:
            i += 1
            continue
        turn = adiff(h1, h2)
        sa = [K[k][2] for k in range(j0, j1 + 1) if K[k][2] is not None]
        if not sa:
            i += 1
            continue
        smin = min(sa)
        sref = (K[j0][2] + K[j1][2]) / 2
        if 55 < turn < 135 and sref > 4 and smin < 0.78 * sref:
            tacks.append((t, cbis(h1, h2)))
            i = j1 + int(gap)
        else:
            i += 1
    return tacks


def interp_track(arr, grid):
    """Resample a boat track [(t,lat,lon)] onto grid times -> [[lng,lat],...]."""
    out = []
    n = len(arr)
    j = 0
    for gt in grid:
        if gt <= arr[0][0]:
            out.append([round(arr[0][2], 5), round(arr[0][1], 5)])
            continue
        if gt >= arr[-1][0]:
            out.append([round(arr[-1][2], 5), round(arr[-1][1], 5)])
            continue
        while j < n - 1 and arr[j + 1][0] < gt:
            j += 1
        a, b = arr[j], arr[j + 1]
        f = (gt - a[0]) / (b[0] - a[0]) if b[0] != a[0] else 0
        lat = a[1] + (b[1] - a[1]) * f
        lon = a[2] + (b[2] - a[2]) * f
        out.append([round(lon, 5), round(lat, 5)])
    return out


def reconstruct_wind(boats_k, t0, t1):
    """Return list of {t, twd, tws} (t = seconds from race start)."""
    all_tacks = []
    for K in boats_k:
        all_tacks += detect_tacks(K)
    all_tacks.sort()
    if len(all_tacks) < 4:
        return []
    # global wind axis (doubled-angle) + windward side via lower upwind speed
    ax_x = sum(math.cos(math.radians(2 * v)) for _, v in all_tacks)
    ax_y = sum(math.sin(math.radians(2 * v)) for _, v in all_tacks)
    axis = (math.degrees(math.atan2(ax_y, ax_x)) / 2) % 360

    def conemean(phi):
        v = [s for K in boats_k for (t, c, s) in K if c is not None and s > 3 and adiff(c, phi) < 50]
        return st.mean(v) if v else 1e9
    gwf = axis if conemean(axis) < conemean((axis + 180) % 360) else (axis + 180) % 360
    folded = [(t, v if adiff(v, gwf) < 90 else (v + 180) % 360) for t, v in all_tacks]

    samples = []
    tw = t0
    while tw < t1:
        b = [v for (t, v) in folded if tw - WIN_STEP <= t < tw + WIN + WIN_STEP]
        if len(b) >= 3:
            x = sum(math.cos(math.radians(v)) for v in b)
            y = sum(math.sin(math.radians(v)) for v in b)
            twd = (math.degrees(math.atan2(y, x)) + 360) % 360
            up = [s for K in boats_k for (t, c, s) in K
                  if tw <= t < tw + WIN and c is not None and s > 3 and adiff(c, twd) < 48]
            peak = [s for K in boats_k for (t, c, s) in K if tw <= t < tw + WIN and s is not None]
            up_med = st.median(up) if up else None
            pk = max(peak) if peak else None
            samples.append([tw + WIN / 2, twd, up_med, pk])
        tw += WIN_STEP
    if not samples:
        return []

    # Fill TWD gaps (windows with no tacks) by circular interpolation across the grid;
    # estimate TWS from upwind speed + reaching peaks (proxy).
    # Build a regular timeline and interpolate.
    times = [t0 + k * WIN_STEP for k in range(int((t1 - t0) / WIN_STEP) + 1)]
    known_t = [s[0] for s in samples]
    known_twd = [s[1] for s in samples]
    # carry upwind/peak signals
    up_known = [(s[0], s[2]) for s in samples if s[2] is not None]
    pk_known = [(s[0], s[3]) for s in samples if s[3] is not None]

    def lerp_circ(ts):
        # nearest two known TWD samples, circular linear interp
        if ts <= known_t[0]:
            return known_twd[0]
        if ts >= known_t[-1]:
            return known_twd[-1]
        for i in range(len(known_t) - 1):
            if known_t[i] <= ts <= known_t[i + 1]:
                f = (ts - known_t[i]) / (known_t[i + 1] - known_t[i])
                a, bb = known_twd[i], known_twd[i + 1]
                d = ((bb - a + 540) % 360) - 180
                return (a + d * f + 360) % 360
        return known_twd[-1]

    def lerp_lin(ts, known):
        if not known:
            return None
        if ts <= known[0][0]:
            return known[0][1]
        if ts >= known[-1][0]:
            return known[-1][1]
        for i in range(len(known) - 1):
            if known[i][0] <= ts <= known[i + 1][0]:
                f = (ts - known[i][0]) / (known[i + 1][0] - known[i][0])
                return known[i][1] + (known[i + 1][1] - known[i][1]) * f
        return known[-1][1]

    out = []
    for ts in times:
        twd = lerp_circ(ts)
        up = lerp_lin(ts, up_known)
        pk = lerp_lin(ts, pk_known)
        # TWS proxy: blend upwind speed (×~1.35) and reaching peak (×~0.95)
        cand = []
        if up:
            cand.append(up * 1.35)
        if pk:
            cand.append(pk * 0.95)
        tws = round(max(cand)) if cand else None
        out.append({'t': round(ts - t0), 'twd': round(twd), 'tws': tws})
    return out


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    color_i = 0
    for fn in sorted(glob.glob(os.path.join(GPX_DIR, '*.gpx'))):
        base = os.path.splitext(os.path.basename(fn))[0]
        meta = META.get(base, (base, 'Race', ''))
        boats, marks = parse(fn)
        boats = [b for b in boats if len(b['arr']) > 500]
        if not boats:
            print('  skip (no boats):', base)
            continue
        t0 = min(b['arr'][0][0] for b in boats)
        t1 = max(b['arr'][-1][0] for b in boats)
        count = int((t1 - t0) / DT) + 1
        grid = [t0 + k * DT for k in range(count)]
        boats_k = [kinematics(b['arr']) for b in boats]
        wind = reconstruct_wind(boats_k, t0, t1)

        out_boats = []
        for bi, b in enumerate(boats):
            col = COLORS.get(b['name'])
            if not col:
                col = PALETTE[bi % len(PALETTE)]
            out_boats.append({
                'name': b['name'], 'skipper': b['skipper'], 'color': col,
                'track': interp_track(b['arr'], grid),
            })

        # course centre for local projection
        pts = [(m['lat'], m['lng']) for m in marks] or \
              [(b['arr'][0][1], b['arr'][0][2]) for b in boats]
        clat = sum(p[0] for p in pts) / len(pts)
        clng = sum(p[1] for p in pts) / len(pts)

        data = {
            'name': meta[0], 'class': meta[1], 'region': 'BVI — North Sound',
            'date': meta[2],
            'start': int(t0 * 1000),
            'dt': DT, 'count': count,
            'center': {'lat': round(clat, 6), 'lng': round(clng, 6)},
            'boats': out_boats,
            'marks': [{'name': m['name'], 'lng': round(m['lng'], 6), 'lat': round(m['lat'], 6)} for m in marks],
            'wind': wind,
        }
        out_fn = os.path.join(OUT_DIR, slugify(meta[0]) + '.json')
        with open(out_fn, 'w') as f:
            json.dump(data, f, separators=(',', ':'))
        size = os.path.getsize(out_fn) / 1024
        mean_twd = None
        if wind:
            x = sum(math.cos(math.radians(w['twd'])) for w in wind)
            y = sum(math.sin(math.radians(w['twd'])) for w in wind)
            mean_twd = round((math.degrees(math.atan2(y, x)) + 360) % 360)
            tws_vals = [w['tws'] for w in wind if w['tws']]
        print(f'  {meta[0]:24s} -> {os.path.basename(out_fn):28s} '
              f'{len(out_boats)} boats, {len(marks)} marks, {count} samples, '
              f'wind ~{mean_twd}° {min(tws_vals)}-{max(tws_vals)}kn, {size:.0f} KB')


if __name__ == '__main__':
    print('Building race JSONs...')
    main()
    print('Done.')
