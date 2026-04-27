import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './config';
import { Subscription, ContactInfo } from '@/lib/types';

const SETTINGS_DOC = 'settings/app';

export interface AppSettings {
  subscription: Subscription;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
  contactInfo: ContactInfo;
}

export const DEFAULT_SETTINGS: AppSettings = {
  subscription: {
    status: 'active',
    amount: 70000,
  },
  notificationsEnabled: true,
  maintenanceMode: false,
  contactInfo: {
    phone: '+54 9 11 0000-0000',
    email: 'info@ranpisosyrevestimientos.com.ar',
    emailAdmin: 'administracion@ranpisosyrevestimientos.com.ar',
    emailSales: 'ventas@ranpisosyrevestimientos.com.ar',
    address: 'Buenos Aires, Argentina',
    whatsapp: '5491100000000',
    instagram: 'https://instagram.com/ranpisos',
    facebook: 'https://facebook.com/ranpisos',
    workingHours: 'Lunes a Viernes de 8:00 a 18:00 hs',
    googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.218553272995!2d-58.4232962!3d-34.59737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcca62d4cf1563%3A0x6a05e269784364!2sObelisco!5e0!3m2!1ses!2sar!4v1710710000000!5m2!1ses!2sar',
  }
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_DOC));
    if (!snap.exists()) {
      return DEFAULT_SETTINGS;
    }
    return snap.data() as AppSettings;
  } catch (error) {
    console.warn("Error getting app settings, using defaults:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Crea el documento settings/app si no existe.
 * Hay que llamarlo UNA VEZ desde el panel dev antes de guardar por primera vez.
 */
export async function initAppSettings(): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.log('[Settings] Initializing settings document in Firestore...');
    await setDoc(ref, DEFAULT_SETTINGS);
    console.log('[Settings] Settings document created.');
  } else {
    console.log('[Settings] Settings document already exists, skipping init.');
  }
}

/**
 * Actualiza campos de subscription usando dot-notation con updateDoc.
 * updateDoc es la única función de Firestore que acepta dot-notation para
 * actualizar campos anidados sin reemplazar el objeto padre completo.
 * Si el documento no existe, lo crea con setDoc primero.
 */
export async function updateSubscription(subscription: Partial<Subscription>): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);

  // Construir objeto con dot-notation: { 'subscription.amount': 1000, ... }
  // IMPORTANTE: esto SOLO funciona con updateDoc, NO con setDoc
  const dotNotation: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(subscription)) {
    dotNotation[`subscription.${key}`] = value;
  }

  console.log('[Settings] Updating subscription with:', dotNotation);

  try {
    // updateDoc actualiza campos específicos sin tocar el resto del documento
    await updateDoc(ref, dotNotation);
    console.log('[Settings] Subscription updated successfully.');
  } catch (error: unknown) {
    // Si el documento no existe, lo creamos con los defaults + los nuevos valores
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'not-found') {
      console.log('[Settings] Document not found, creating it from scratch...');
      await setDoc(ref, {
        ...DEFAULT_SETTINGS,
        subscription: {
          ...DEFAULT_SETTINGS.subscription,
          ...subscription,
        },
      });
      console.log('[Settings] Document created with new subscription data.');
    } else {
      console.error('[Settings] Error updating subscription:', error);
      throw error;
    }
  }
}

/**
 * Actualiza campos de contactInfo usando dot-notation con updateDoc.
 */
export async function updateContactInfo(contactInfo: Partial<ContactInfo>): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);

  const dotNotation: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(contactInfo)) {
    dotNotation[`contactInfo.${key}`] = value;
  }

  console.log('[Settings] Updating contactInfo with:', dotNotation);

  try {
    await updateDoc(ref, dotNotation);
    console.log('[Settings] Contact info updated successfully.');
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'not-found') {
      console.log('[Settings] Document not found, creating it...');
      await setDoc(ref, {
        ...DEFAULT_SETTINGS,
        contactInfo: {
          ...DEFAULT_SETTINGS.contactInfo,
          ...contactInfo,
        },
      });
    } else {
      console.error('[Settings] Error updating contact info:', error);
      throw error;
    }
  }
}

/**
 * @deprecated Usar updateSubscription o updateContactInfo en su lugar.
 */
export async function updateAppSettings(settings: Partial<AppSettings>) {
  const ref = doc(db, SETTINGS_DOC);
  await setDoc(ref, settings, { merge: true });
}

export function subscribeToSettings(callback: (settings: AppSettings) => void) {
  return onSnapshot(
    doc(db, SETTINGS_DOC),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AppSettings);
      } else {
        callback(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      if (error.code === 'permission-denied' && !auth.currentUser) {
        callback(DEFAULT_SETTINGS);
        return;
      }
      console.error("Error subscribing to settings:", error);
      callback(DEFAULT_SETTINGS);
    }
  );
}
