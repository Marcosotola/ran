import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from './config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * Registra o actualiza el token FCM del usuario en Firestore.
 *
 * FCM puede rotar el token cuando:
 *   - El usuario borra datos del browser
 *   - El Service Worker se invalida
 *   - Pasan ~60 días sin uso
 *
 * Esta función se llama en cada login/mount y compara el token actual
 * con el que ya estaba guardado. Si cambió, reemplaza el viejo por el nuevo.
 *
 * @param userId  UID del usuario logueado
 * @param knownTokens Tokens que actualmente están en Firestore (del ranUser)
 */
export async function requestNotificationPermission(
  userId: string,
  knownTokens?: string[]
) {
  if (!userId) return;

  try {
    const messagingInstance = await messaging();
    if (!messagingInstance) return;

    // Si el permiso ya fue denegado, no lo pedimos de nuevo
    if (Notification.permission === 'denied') return;

    // Solo pedimos el permiso si aún no fue concedido
    let permission: NotificationPermission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') return;

    const token = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (!token) return;

    const userRef = doc(db, 'users', userId);

    // ── Detectar si el token rotó ──────────────────────────────────────────
    // Si el token actual NO está en la lista conocida de Firestore,
    // significa que FCM lo rotó (o es un dispositivo nuevo).
    // Removemos tokens viejos de este dispositivo sólo si podemos identificarlos.
    const isNewToken = !knownTokens || !knownTokens.includes(token);

    if (isNewToken && knownTokens && knownTokens.length > 0) {
      // Hay tokens viejos: los dejamos (pueden ser otros dispositivos)
      // Solo limpiamos si el servidor ya detectó que uno es inválido
      // (eso lo hace admin-messaging.ts automáticamente al enviar)
      console.log('[FCM] Token rotado o dispositivo nuevo — agregando token actualizado');
    }

    // Siempre usamos arrayUnion: si ya existe no se duplica,
    // si es nuevo se agrega. Firestore deduplica el array.
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      notificationsEnabled: true,
      fcmLastUpdated: new Date().toISOString(),
    });

    console.log('[FCM] Token registrado/actualizado correctamente');
    return token;
  } catch (error) {
    console.error('[FCM] Error al obtener/registrar token:', error);
  }
}

/**
 * Elimina un token específico de Firestore (usado al hacer logout
 * o cuando el usuario desactiva las notificaciones).
 */
export async function removeFCMToken(userId: string, token: string) {
  if (!userId || !token) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token),
    });
    console.log('[FCM] Token removido de Firestore');
  } catch (error) {
    console.error('[FCM] Error al remover token:', error);
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
