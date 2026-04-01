import { db } from './config';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  getDocs,
  where,
  updateDoc,
  doc,
  limit
} from 'firebase/firestore';

export interface ContactMessage {
  id?: string;
  name: string;
  lastName: string;
  email: string;
  message: string;
  userId?: string;
  createdAt: any;
  status: 'pending' | 'read' | 'replied';
}

export async function sendContactMessage(data: Omit<ContactMessage, 'createdAt' | 'status'>) {
  const messagesRef = collection(db, 'contact_messages');
  const docRef = await addDoc(messagesRef, {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Notificar a los roles (creando un documento en una colección de notificaciones)
  await addDoc(collection(db, 'notifications'), {
    title: 'Nueva consulta recibida',
    body: `${data.name} ha enviado un mensaje: "${data.message.substring(0, 50)}..."`,
    type: 'contact_message',
    messageId: docRef.id,
    roles: ['admin', 'vendedor', 'secretaria'],
    readBy: [],
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getContactMessages() {
  const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContactMessage[];
}

export async function getUserContactMessages(userId: string) {
  const q = query(
    collection(db, 'contact_messages'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContactMessage[];
}

export async function markMessageAsRead(id: string) {
  const messageRef = doc(db, 'contact_messages', id);
  await updateDoc(messageRef, { status: 'read' });
}
