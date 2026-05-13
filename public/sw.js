const CACHE_NAME = 'webeng2-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/Icon.png',
  '/img/Icon.jpeg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIs nie cachen — immer frische Daten holen
  if (url.hostname.includes('nominatim') || url.hostname.includes('wikipedia')) {
    return;
  }

  // Map-Tiles: Cache-First (Tiles ändern sich selten, spart Bandbreite offline)
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Gleiche Origin (App-Shell + Vite-Bundles): Cache-First mit Runtime-Caching
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
