const CACHE_NAME = 'property-empire-v6.7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/intro.js',
  './js/audio.js',
  './js/data.js',
  './js/game.js',
  './js/graphics.js',
  './js/imageloader.js',
  './js/mosaic.js',
  './js/city3d-engine.js',
  './js/cities/new_york.js',
  './js/cities/london.js',
  './js/cities/tokyo.js',
  './js/cities/dubai.js',
  './js/cities/paris.js',
  './js/cities/sydney.js',
  './js/cities/singapore.js',
  './js/cities/hong_kong.js',
  './js/cities/barcelona.js',
  './js/cities/rome.js',
  './js/cities/berlin.js',
  './js/cities/amsterdam.js',
  './js/cities/toronto.js',
  './js/cities/monaco.js',
  './js/cities/shanghai.js',
  './js/cities/mumbai.js',
  './js/cities/sao_paulo.js',
  './js/cities/cape_town.js',
  './js/cities/los_angeles.js',
  './js/cities/miami.js',
  './js/ui.js',
  './js/app.js',
  './manifest.json'
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
