import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Admin SDK] Successfully initialized');
  } catch (err: any) {
    console.error('[Admin SDK] Initialization error:', err.message);
  }
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
