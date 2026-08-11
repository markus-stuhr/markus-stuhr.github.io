const CACHE_NAME = 'open-meteo-cache-v1';
const CACHEABLE_HOSTS = ['api.open-meteo.com', 'archive-api.open-meteo.com'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !CACHEABLE_HOSTS.includes(url.hostname)) return;

  event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Im Hintergrund aktualisieren, aber sofort den Cache-Treffer zurückgeben.
    networkFetch;
    return cached;
  }

  const fresh = await networkFetch;
  if (fresh) return fresh;
  throw new Error('Open-Meteo request failed and no cache entry available');
}
