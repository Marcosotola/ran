import { db } from './config';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { RANUser } from '../types';

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ ...d.data(), uid: d.id })) as RANUser[];
}

export async function updateUser(uid: string, data: Partial<RANUser>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
}

export async function deleteUser(uid: string) {
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
}
