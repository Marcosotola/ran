const CACHE_NAME = 'ran-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Respondemos con la red pero el evento debe existir para ser instalable
  event.respondWith(fetch(event.request).catch(() => {
    return null;
  }));
});
