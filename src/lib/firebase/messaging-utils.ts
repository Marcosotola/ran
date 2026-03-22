import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from './config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function requestNotificationPermission(userId: string) {
  if (!userId) return;

  try {
    const messagingInstance = await messaging();
    if (!messagingInstance) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messagingInstance, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token) {
        // Guardar el token en el usuario en Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token), // Usamos array para soportar múltiples dispositivos
          notificationsEnabled: true
        });
        return token;
      }
    }
  } catch (error) {
    console.error('Error al obtener permiso/token:', error);
  }
}

export async function onMessageListener() {
  const messagingInstance = await messaging();
  if (!messagingInstance) return;

  return new Promise((resolve) => {
    onMessage(messagingInstance, (payload) => {
      resolve(payload);
    });
  });
}
