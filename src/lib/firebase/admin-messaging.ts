import { dbAdmin } from './admin-config';
import * as admin from 'firebase-admin';

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  if (!userId || !dbAdmin) return;

  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.fcmTokens || userData.notificationsEnabled === false) {
      console.log(`[Push] Usuario ${userId} no tiene tokens o notificaciones desactivadas`);
      return;
    }

    const tokens = userData.fcmTokens as string[];
    if (tokens.length === 0) return;

    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[Push] ${response.successCount} mensajes enviados correctamente`);

    // Limpieza de tokens inválidos
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error?.code;
          if (error === 'messaging/invalid-registration-token' || error === 'messaging/registration-token-not-registered') {
            failedTokens.push(tokens[idx]);
          }
        }
      });
      
      if (failedTokens.length > 0 && dbAdmin) {
        await dbAdmin.collection('users').doc(userId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
        });
      }
    }
  } catch (error) {
    console.error('[Push] Error enviando notificación:', error);
  }
}
