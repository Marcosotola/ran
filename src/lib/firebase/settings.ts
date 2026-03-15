import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { Subscription } from '@/lib/types';

const SETTINGS_DOC = 'settings/app';

export interface AppSettings {
  subscription: Subscription;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  subscription: {
    status: 'active', // Default to active for initial setup
    amount: 70000,
  },
  notificationsEnabled: true,
  maintenanceMode: false,
};

export async function getAppSettings(): Promise<AppSettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) {
    await setDoc(doc(db, SETTINGS_DOC), DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return snap.data() as AppSettings;
}

export async function updateSubscription(sub: Partial<Subscription>) {
  const ref = doc(db, SETTINGS_DOC);
  await updateDoc(ref, {
    'subscription.status': sub.status,
    'subscription.lastPaymentDate': sub.lastPaymentDate,
    'subscription.nextPaymentDate': sub.nextPaymentDate,
    'subscription.mpPreapprovalId': sub.mpPreapprovalId,
  });
}

export function subscribeToSettings(callback: (settings: AppSettings) => void) {
  return onSnapshot(doc(db, SETTINGS_DOC), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as AppSettings);
    } else {
      callback(DEFAULT_SETTINGS);
    }
  });
}
