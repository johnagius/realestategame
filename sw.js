const CACHE_NAME = 'property-empire-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/audio.js',
  '/js/data.js',
  '/js/game.js',
  '/js/graphics.js',
  '/js/imageloader.js',
  '/js/ui.js',
  '/js/app.js',
  '/manifest.json'
];

// Install — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for core assets, network-first for images
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Images: network first, cache fallback
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Core assets: cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
