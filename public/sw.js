const CACHE_NAME = 'ran-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Evento Fetch obligatorio para PWA instalable
self.addEventListener('fetch', (event) => {
  // Respondemos con la red por defecto, pero el evento debe existir
  event.respondWith(fetch(event.request).catch(() => {
    // Si falla la red (offline), podríamos retornar algo aquí
    return null;
  }));
});
