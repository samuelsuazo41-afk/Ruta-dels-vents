const CACHE_NAME = 'catlingo-v29';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/capitol_01_barcelona.json',
  '/data/capitol_02_girona.json',
  '/data/capitol_03_tarragona.json',
  '/data/capitol_04_lleida.json',
  '/data/capitol_05_vic.json',
  '/data/capitol_06_tarragona.json',
  '/data/capitol_07_girona.json',
  '/data/capitol_08_barcelona.json',
  '/data/capitol_09_lleida.json',
  '/data/capitol_10_vic.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});