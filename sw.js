const CACHE_NAME = 'ironlog-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './meals.html',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// NETWORK-FIRST strategy: always try to fetch the latest file from GitHub.
// Only fall back to the cached copy if the network request fails (offline).
// This means any file you update on GitHub shows up immediately on next load,
// with no need to manually bump CACHE_NAME or clear anything.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, {cache: 'no-store'})
      .then((response) => {
        // Got a fresh copy from the network — cache it for offline fallback later
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => {
        // Network failed (offline) — serve the last cached version instead
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // No cache either — fall back to the app shell so it doesn't fully break
          return caches.match('./index.html');
        });
      })
  );
});
