import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { Sale, Quote } from '@/lib/types';
import { adjustStock } from './products';

const SALES_COL = 'sales';

export async function createDirectSale(data: Omit<Sale, 'id' | 'createdAt'>): Promise<string> {
  // Use a transaction to ensure stock is updated alongside sale creation
  return await runTransaction(db, async (transaction) => {
    // 1. Register the sale
    const saleRef = doc(collection(db, SALES_COL));
    transaction.set(saleRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    // 2. Adjust stock for each item
    for (const item of data.items) {
      // Avoid crash if it's an AI-temp ID or manually typed name
      const isAI = item.productId?.startsWith('ai-') || item.productId === 'ai-generated';
      const isManual = item.productId?.startsWith('manual-');

      if (item.productId && !isAI && !isManual) {
        try {
          const productRef = doc(db, 'products', item.productId);
          transaction.update(productRef, {
            stock: increment(-item.boxes),
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          console.warn('Could not update stock for product:', item.productId);
        }
      }
    }

    return saleRef.id;
  });
}


export async function convertQuoteToSale(quote: Quote, paymentMethod: Sale['paymentMethod']): Promise<string> {
  if (!quote.id) throw new Error('Quote must have an ID');

  const saleId = await createDirectSale({
    quoteId: quote.id,
    clientId: quote.clientId ?? 'anonymous',
    clientName: quote.clientName ?? 'Cliente Chat',
    vendorId: quote.assignedVendorId ?? 'none',
    items: quote.items,
    totalAmount: quote.grandTotal,
    paymentMethod,
    status: 'paid', // Default to paid when converting
  });

  // Update quote status
  await updateDoc(doc(db, 'quotes', quote.id), {
    status: 'converted',
    updatedAt: serverTimestamp(),
  });

  return saleId;
}

export async function getSales(): Promise<Sale[]> {
  const q = query(collection(db, SALES_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? new Date(),
    deliveredAt: d.data().deliveredAt?.toDate(),
  })) as Sale[];
}
export async function deleteSale(id: string): Promise<void> {
  await deleteDoc(doc(db, SALES_COL, id));
}

export async function updateSale(id: string, data: Partial<Sale>): Promise<void> {
  const ref = doc(db, SALES_COL, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
