// Service Worker — cache MapTiler + OpenSeaMap tiles to reduce API requests.
// Tiles are immutable by coordinates → cache-first.
// Style/metadata files can change → network-first with cache fallback.

const CACHE = 'sailing-map-v1';

// Matches actual tile URLs: .../z/x/y.(pbf|webp|png|jpg)
const TILE_RE = /\/\d+\/\d+\/\d+\.(pbf|webp|png|jpg)/;

function isCacheable(url) {
  return url.includes('api.maptiler.com') || url.includes('openseamap.org');
}

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (!isCacheable(url)) return;

  if (TILE_RE.test(url)) {
    // ── Cache-first: tiles at fixed coordinates never change ──────────────
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
  } else {
    // ── Network-first: style.json / glyphs / sprites may change ──────────
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
