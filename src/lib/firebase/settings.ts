import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { Subscription, ContactInfo } from '@/lib/types';

const SETTINGS_DOC = 'settings/app';

export interface AppSettings {
  subscription: Subscription;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
  contactInfo: ContactInfo;
}

const DEFAULT_SETTINGS: AppSettings = {
  subscription: {
    status: 'active',
    amount: 70000,
  },
  notificationsEnabled: true,
  maintenanceMode: false,
  contactInfo: {
    phone: '+54 9 11 0000-0000',
    email: 'info@ranpisos.com.ar',
    address: 'Buenos Aires, Argentina',
    whatsapp: '5491100000000',
    instagram: 'https://instagram.com/ranpisos',
    facebook: 'https://facebook.com/ranpisos',
    workingHours: 'Lunes a Viernes de 8:00 a 18:00 hs',
    googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.218553272995!2d-58.4232962!3d-34.59737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcca62d4cf1563%3A0x6a05e269784364!2sObelisco!5e0!3m2!1ses!2sar!4v1710710000000!5m2!1ses!2sar',
  }
};

export async function getAppSettings(): Promise<AppSettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) {
    await setDoc(doc(db, SETTINGS_DOC), DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return snap.data() as AppSettings;
}

export async function updateAppSettings(settings: Partial<AppSettings>) {
  const ref = doc(db, SETTINGS_DOC);
  await updateDoc(ref, settings as any);
}

export async function updateSubscription(subscription: Partial<Subscription>) {
  const current = await getAppSettings();
  const updated = {
    ...current,
    subscription: {
      ...current.subscription,
      ...subscription
    }
  };
  await updateAppSettings(updated);
}

export async function updateContactInfo(contactInfo: Partial<ContactInfo>) {
  const current = await getAppSettings();
  const updated = {
    ...current,
    contactInfo: {
      ...current.contactInfo,
      ...contactInfo
    }
  };
  await updateAppSettings(updated);
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
      console.error("Error subscribing to settings:", error);
      callback(DEFAULT_SETTINGS);
    }
  );
}
