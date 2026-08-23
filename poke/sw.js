/* Kartenbaum — Service Worker
 *
 * Drei Caches mit unterschiedlicher Strategie:
 *   shell  — App selbst, cache-first mit Hintergrund-Update
 *   api    — TCGdex-JSON, stale-while-revalidate
 *   img    — Kartenbilder, cache-first mit Deckel
 *
 * Die API schickt "cache-control: no-store". Der Browser-Cache greift dort
 * also nicht — ohne diesen Worker gäbe es kein Offline und bei jedem Aufklappen
 * einen neuen Request.
 */

const V     = 'kartenbaum-v1';
const SHELL = `${V}-shell`;
const API   = `${V}-api`;
const IMG   = `${V}-img`;

const SHELL_FILES = ['./', './index.html', './manifest.webmanifest'];

const IMG_MAX = 3000;   // Kartenbilder ~35 KB → Deckel bei grob 100 MB

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(V)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'clear') {
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))));
  }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname === 'api.tcgdex.net')    return e.respondWith(swr(req));
  if (url.hostname === 'assets.tcgdex.net') return e.respondWith(cacheFirst(req, IMG, true));
  /* Pokédex-Sprites von PokeAPI/sprites — ändern sich nie */
  if (url.hostname === 'raw.githubusercontent.com') return e.respondWith(cacheFirst(req, IMG, true));
  if (url.origin === self.location.origin)  return e.respondWith(shell(req));
});

/* Stale-while-revalidate: sofort aus dem Cache antworten, im Hintergrund frischen. */
async function swr(req) {
  const cache = await caches.open(API);
  const hit   = await cache.match(req);

  const net = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  if (hit) return hit;

  const res = await net;
  return res || new Response(JSON.stringify({ error: 'offline' }), {
    status: 503, headers: { 'content-type': 'application/json' }
  });
}

/* Cache-first für Bilder — die ändern sich nie. */
async function cacheFirst(req, name, trim) {
  const cache = await caches.open(name);
  const hit   = await cache.match(req);
  if (hit) return hit;

  try {
    const res = await fetch(req);
    /* Opake Antworten (img ohne crossorigin) haben status 0 und res.ok === false.
       Die Seite setzt crossOrigin, aber als Netz greifen wir sie trotzdem ab. */
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(req, res.clone());
      if (trim) trimCache(name, IMG_MAX);
    }
    return res;
  } catch {
    return new Response('', { status: 504 });
  }
}

/* App-Shell: Cache zuerst, Netz im Hintergrund für das nächste Mal. */
async function shell(req) {
  const cache = await caches.open(SHELL);
  const hit   = await cache.match(req, { ignoreSearch: true });

  const net = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  if (hit) return hit;   // net läuft im Hintergrund weiter und frischt den Cache

  const res = await net;
  if (res) return res;

  const idx = await cache.match('./index.html');
  return idx || new Response('offline', { status: 503 });
}

/* Ältestes zuerst rauswerfen, wenn der Deckel überschritten ist. */
let trimming = false;
async function trimCache(name, max) {
  if (trimming) return;
  trimming = true;
  try {
    const cache = await caches.open(name);
    const keys  = await cache.keys();
    if (keys.length > max) {
      await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
    }
  } finally {
    trimming = false;
  }
}
