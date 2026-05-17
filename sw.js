const CACHE_NAME = 'catlingo-v9';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/capitol_01_barcelona.json',
  '/data/capitol_02_girona.json',
  '/data/capitol_03_tarragona.json',
  '/data/capitol_04_lleida.json',
  '/data/capitol_05_vic.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});