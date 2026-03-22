import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { Quote, QuoteStatus, ChatMessage } from '@/lib/types';

const QUOTES_COL = 'quotes';

export async function createQuote(
  data: Omit<Quote, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, QUOTES_COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getQuote(id: string): Promise<Quote | null> {
  const snap = await getDoc(doc(db, QUOTES_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: snap.data().createdAt?.toDate() } as Quote;
}

export async function getQuotesByClient(clientId: string): Promise<Quote[]> {
  const q = query(
    collection(db, QUOTES_COL),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  })) as Quote[];
}

export async function getQuotesByVendor(vendorId: string): Promise<Quote[]> {
  const q = query(
    collection(db, QUOTES_COL),
    where('assignedVendorId', '==', vendorId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  })) as Quote[];
}

export async function getAllQuotes(statusFilter?: QuoteStatus): Promise<Quote[]> {
  const constraints = statusFilter
    ? [where('status', '==', statusFilter), orderBy('createdAt', 'desc')]
    : [orderBy('createdAt', 'desc')];
  const q = query(collection(db, QUOTES_COL), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  })) as Quote[];
}

export async function updateQuote(
  id: string,
  data: Partial<Omit<Quote, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, QUOTES_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
  extra?: Partial<Omit<Quote, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, QUOTES_COL, id), {
    status,
    ...(extra ?? {}),
    ...(status === 'accepted' ? { acceptedAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function updateQuoteLog(id: string, messages: ChatMessage[]): Promise<void> {
  await updateDoc(doc(db, QUOTES_COL, id), { aiConversationLog: messages });
}

export async function deleteQuote(id: string): Promise<void> {
  await deleteDoc(doc(db, QUOTES_COL, id));
}

/** Pick a random available vendor to assign to a new quote */
export async function assignRandomVendor(): Promise<string | null> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'vendedor'),
    where('isActive', '==', true),
    limit(10),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const vendors = snap.docs;
  return vendors[Math.floor(Math.random() * vendors.length)].id;
}
export async function getPendingQuotesCount(): Promise<number> {
  try {
    const q = query(
      collection(db, QUOTES_COL),
      where('status', '==', 'sent')
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('Error fetching pending quotes count:', error);
    return 0;
  }
}
