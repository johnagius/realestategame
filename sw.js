const CACHE_NAME = 'property-empire-v3.7';
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

// Install — cache core assets, skip waiting to activate immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches, claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST for JS/CSS/HTML (always get fresh code)
// Cache fallback only when offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network first for all app files — always try to get latest code
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Offline — serve from cache
      return caches.match(event.request);
    })
  );
});
