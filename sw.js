const CACHE_NAME = 'property-empire-v8.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/components.css',
  './css/splash.css',
  './css/app.css',
  './assets/icons.svg',
  './assets/icon.svg',
  './assets/report/quiet.svg',
  './assets/report/warning.svg',
  './assets/report/era.svg',
  './assets/report/succession.svg',
  './assets/report/crash.svg',
  './assets/report/deal.svg',
  './assets/advisor.svg',
  './js/ui/share.js',
  './js/ui/appraisal.js',
  './js/ui/advisor.js',
  './js/ui/guide.js',
  './js/vendor/three.min.js',
  './js/city3d-engine.js',
  './js/cities/london.js',
  './js/cities/paris.js',
  './js/cities/new_york.js',
  './js/cities/amsterdam.js',
  './js/cities/berlin.js',
  './js/cities/rome.js',
  './js/cities/barcelona.js',
  './js/cities/monaco.js',
  './js/cities/sydney.js',
  './js/cities/hong_kong.js',
  './js/cities/mumbai.js',
  './js/cities/toronto.js',
  './js/cities/shanghai.js',
  './js/cities/cape_town.js',
  './js/cities/tokyo.js',
  './js/cities/singapore.js',
  './js/cities/los_angeles.js',
  './js/cities/sao_paulo.js',
  './js/cities/miami.js',
  './js/cities/dubai.js',
  './js/intro.js',
  './js/audio.js',
  './js/ads.js',
  './js/engine/rng.js',
  './js/engine/storage.js',
  './js/engine/data.js',
  './js/engine/state.js',
  './js/engine/property.js',
  './js/engine/finance.js',
  './js/engine/market.js',
  './js/engine/rivals.js',
  './js/engine/dynasty.js',
  './js/engine/events.js',
  './js/engine/goals.js',
  './js/engine/cities.js',
  './js/engine/turn.js',
  './js/engine/game.js',
  './js/ui/core.js',
  './js/ui/start.js',
  './js/ui/hud.js',
  './js/ui/deals.js',
  './js/ui/city.js',
  './js/ui/portfolio.js',
  './js/ui/dynasty.js',
  './js/ui/rivals.js',
  './js/ui/year.js',
  './js/ui/app.js'
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

// Fetch — NETWORK FIRST for same-origin files (always get fresh code), cache fallback when offline.
// Query strings (?v=) are ignored when matching the cache so the precache list serves versioned requests.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
