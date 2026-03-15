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
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { Product, ProductCategory } from '@/lib/types';

const PRODUCTS_COL = 'products';

// ----- Read -----
export async function getProducts(filters?: {
  category?: ProductCategory;
  size?: string;
  isActive?: boolean;
}): Promise<Product[]> {
  const constraints: QueryConstraint[] = [];

  if (filters?.category) constraints.push(where('category', '==', filters.category));
  if (filters?.size) constraints.push(where('size', '==', filters.size));
  if (filters?.isActive !== undefined) constraints.push(where('isActive', '==', filters.isActive));

  // No orderBy here to avoid composite index requirements which fail silently/require manual setup
  // Sorting is handled client-side in the CatalogoPage component

  const q = query(collection(db, PRODUCTS_COL), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
  })) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, PRODUCTS_COL, id));
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
    updatedAt: snap.data().updatedAt?.toDate() ?? new Date(),
  } as Product;
}

// ----- Write -----
export async function createProduct(
  data: Omit<Product, 'id' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, PRODUCTS_COL), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COL, id));
}

/** Alias for createProduct — used by the product upload form */
export const addProduct = createProduct;

import { increment } from 'firebase/firestore';

// ... (existing code)

// ----- Helpers -----
export async function getProductSizes(): Promise<string[]> {
  const snap = await getDocs(collection(db, PRODUCTS_COL));
  const sizes = new Set<string>();
  snap.docs.forEach((d) => sizes.add(d.data().size));
  return Array.from(sizes).sort();
}

/** Increment or decrement stock of a product */
export async function adjustStock(id: string, amount: number): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COL, id), {
    stock: increment(amount),
    updatedAt: serverTimestamp(),
  });
}
