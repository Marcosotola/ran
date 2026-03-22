// Service Worker simple para habilitar PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo necesitamos el evento fetch para que sea instalable
  // No realizamos caché compleja aquí (opcional)
});
