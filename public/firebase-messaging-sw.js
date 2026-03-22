importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// Configuración de Firebase para el Service Worker
// NOTA: Estas claves son públicas y necesarias para que el navegador se conecte a Firebase.
firebase.initializeApp({
  apiKey: "AIzaSyAI7b0A2cqzPiPH_Y7M_9tpeWfDdsfStaM",
  authDomain: "ran-pisos-revestimientos.firebaseapp.com",
  projectId: "ran-pisos-revestimientos",
  storageBucket: "ran-pisos-revestimientos.firebasestorage.app",
  messagingSenderId: "761332888445",
  appId: "1:761332888445:web:f47edc15afc2e9ed429214"
});

const messaging = firebase.messaging();

// Manejador de mensajes en segundo plano (cuando la pestaña está cerrada o en el fondo)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva notificación de RAN';
  const notificationOptions = {
    body: payload.notification?.body || 'Presupuesto o aviso generado.',
    icon: '/logo2Azul.svg', // Icono de la app
    badge: '/logo2Azul.svg',
    data: payload.data,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
