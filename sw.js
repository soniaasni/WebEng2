// Service Worker — WebEng2 Map App
// Dynamischer Scope: funktioniert lokal (/sw.js) und auf GitHub Pages (/WebEng2/sw.js)

const CACHE_NAME = 'webeng2-v4';

// Scope wird zur Laufzeit ermittelt — unabhängig vom Deployment-Pfad
const SCOPE = self.registration.scope; // z.B. "https://user.github.io/WebEng2/"

const APP_SHELL = [
  SCOPE,
  new URL('offline.html', SCOPE).href,
  new URL('manifest.json', SCOPE).href,
  new URL('img/Icon.png', SCOPE).href,
];

// ── Install: App-Shell vorab cachen ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: alte Cache-Versionen löschen ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

// ── Fetch: Caching-Strategien je nach Request-Typ ─────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nominatim, Wikipedia & Routing nie cachen — immer frische Daten
  if (
    url.hostname.includes('nominatim') ||
    url.hostname.includes('wikipedia') ||
    url.hostname.includes('routing.openstreetmap.de')
  ) {
    return; // nativer Fetch ohne SW-Eingriff
  }

  // Map-Tiles: Cache-First (Tiles ändern sich selten, spart Bandbreite offline)
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Gleiche Origin (App-Shell + Vite-Bundles): Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ── Cache-First: liefert gecachte Version, falls vorhanden ────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

// ── Stale-While-Revalidate: sofort aus Cache, im Hintergrund aktualisieren ─
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || offlineFallback(request);
}

// ── Offline-Fallback: offline.html bei Navigation ─────────────────────────
async function offlineFallback(request) {
  if (request.mode === 'navigate') {
    const fallback = await caches.match(new URL('offline.html', SCOPE).href);
    if (fallback) return fallback;
  }
  return Response.error();
}
