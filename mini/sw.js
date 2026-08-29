/* Service Worker für den Minifiguren-Katalog.
 *
 * Drei Ebenen:
 *   Shell (HTML)  network-first  — nach einem Deploy sofort die neue Version
 *   Daten (JSON)  stale-while-revalidate — sofort da, im Hintergrund aktualisiert
 *   Bilder (CDN)  cache-first mit Deckel — Rebrickable liefert keine CORS-Header,
 *                 die Antworten sind also "opaque". Chrome rechnet die im Quota mit
 *                 einem festen Aufschlag (~7 MB je Eintrag), deshalb ein harter
 *                 Deckel und ein Abbruch bei QuotaExceededError.
 */
const VERSION = 'v2';
const SHELL = 'mini-shell-' + VERSION;
const DATA  = 'mini-data-'  + VERSION;
const IMG   = 'mini-img-'   + VERSION;

// Gemessen 2026-08-29: 400 opaque Bilder = 2,9 GB Quota-Verbrauch (~7 MB je Eintrag,
// echte Dateigrösse ~170 KB). Deshalb klein halten — für Wiederbesuche sorgt ohnehin
// der HTTP-Cache des Browsers, das CDN liefert max-age=31536000.
const IMG_LIMIT = 150;             // Bilder im Cache (~1 GB nominal)
const CDN = 'https://cdn.rebrickable.com/';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(['./', './index.html', './data/index.json']).catch(() => {});
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [SHELL, DATA, IMG];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'clear-images') {
    e.waitUntil(caches.delete(IMG).then(() => caches.open(IMG)));
  }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.url.startsWith(CDN)) return e.respondWith(imageFirst(req));
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/data/')) return e.respondWith(dataSWR(req));
  if (req.mode === 'navigate' || url.pathname.endsWith('.html'))
    return e.respondWith(shellNetworkFirst(req));
});

/* Bilder: erst Cache, sonst Netz und ablegen (auch opaque) */
async function imageFirst(req) {
  const cache = await caches.open(IMG);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  // status 0 = opaque; 404 nicht speichern, sonst bleibt eine Lücke dauerhaft
  if (res.type === 'opaque' || res.ok) {
    try {
      await cache.put(req, res.clone());
      trim(cache, IMG_LIMIT);
    } catch (err) { /* Quota voll — dann eben ohne Cache */ }
  }
  return res;
}

/* Daten: sofort aus dem Cache, parallel erneuern */
async function dataSWR(req) {
  const cache = await caches.open(DATA);
  const hit = await cache.match(req);
  const net = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => hit);
  return hit || net;
}

/* Shell: online immer frisch, offline aus dem Cache */
async function shellNetworkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    return (await cache.match(req)) || (await cache.match('./index.html'));
  }
}

/* Ältesten Einträgen den Platz nehmen — keys() liefert Einfügereihenfolge */
async function trim(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (const k of keys.slice(0, keys.length - limit)) await cache.delete(k);
}
