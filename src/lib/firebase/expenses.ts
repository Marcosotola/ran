import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { Expense } from '../types';

const COLLECTION = 'expenses';

export async function createExpense(data: Omit<Expense, 'id' | 'date'>) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    date: serverTimestamp()
  });
  return ref.id;
}

export async function getExpenses() {
  const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date: (d.data().date as Timestamp)?.toDate() || new Date()
  })) as Expense[];
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteExpense(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
