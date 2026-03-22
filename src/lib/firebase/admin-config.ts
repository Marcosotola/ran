import * as admin from 'firebase-admin';

const hasCredentials = 
  !!process.env.FIREBASE_ADMIN_PROJECT_ID && 
  !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
  !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (hasCredentials && !admin.apps.length) {
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
} else if (!hasCredentials) {
  console.warn('[Admin SDK] Warning: No credentials found. Admin services will be unavailable.');
}

// Proxy-like lazy export to avoid crash on evaluation
export const getDbAdmin = () => {
  if (!admin.apps.length && !hasCredentials) return null;
  return admin.firestore();
};

export const getAuthAdmin = () => {
  if (!admin.apps.length && !hasCredentials) return null;
  return admin.auth();
};

// Also export as legacy for compatibility if possible, though getters are better
export const dbAdmin = hasCredentials ? admin.firestore() : null;
export const authAdmin = hasCredentials ? admin.auth() : null;
