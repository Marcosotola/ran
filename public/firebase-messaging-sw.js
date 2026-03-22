importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// Los config serán inyectados o usaremos los del .env si es posible 
// Pero para que funcione, el SW necesita su propia inicialización
firebase.initializeApp({
  apiKey: "AIzaSy...", // Se recomienda no dejarlo vacío, pero en el SW de Firebase 
  // a veces se recupera del manifest si está bien vinculado.
  // Sin embargo, para mayor estabilidad, lo ideal es que el cliente lo pase.
  messagingSenderId: "123..." // El ID de tu proyecto de Firebase
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo2Azul.svg', // Icono de la app
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
