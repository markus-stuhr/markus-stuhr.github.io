// Service Worker for the sailing simulator.
// Caches the heavy, repeatedly-fetched assets so reloads are fast and we don't
// re-hit the MapTiler API every time:
//   - map/terrain tiles (immutable by z/x/y)        -> cache-first
//   - CDN libraries (three, maplibre — versioned)   -> cache-first
//   - style.json / glyphs / sprites (may change)    -> network-first w/ fallback

const CACHE = 'sim-cache-v1';

// tile URLs: .../z/x/y(@2x).(pbf|webp|png|jpg)
const TILE_RE = /\/\d+\/\d+\/\d+(@\dx)?\.(pbf|webp|png|jpg)/;

function isTile(url) {
  return url.includes('api.maptiler.com') && TILE_RE.test(url);
}
function isLib(url) {
  return url.includes('unpkg.com') || url.includes('cdn.jsdelivr.net');
}
function isMapMeta(url) {
  // style.json, tiles.json, glyphs (fonts), sprites
  return url.includes('api.maptiler.com');
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (event.request.method !== 'GET') return;

  // Cache-first for immutable assets (tiles + versioned CDN libs)
  if (isTile(url) || isLib(url)) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            // cache successful or opaque (cross-origin no-cors) responses
            if (res && (res.ok || res.type === 'opaque')) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // Network-first for map metadata (style/glyphs/sprites can change)
  if (isMapMeta(url)) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
