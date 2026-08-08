import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, or,
} from 'firebase/firestore';
import { db } from '../firebase';

const CUSTOMERS_COL = 'customers';

/**
 * Search customers by name or phone.
 */
export async function searchCustomers(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];

  const term = searchTerm.toLowerCase();

  // Firestore doesn't support full-text search natively.
  // We'll query by searchName field and filter client-side.
  const q = query(
    collection(db, CUSTOMERS_COL),
    orderBy('name'),
    limit(20)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) =>
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(searchTerm)
    );
}

/**
 * Quick-create a customer during billing.
 */
export async function quickCreateCustomer(name, phone = '') {
  const data = {
    name,
    phone,
    email: '',
    address: '',
    gstin: '',
    shopId: 'default',
    khataBalance: 0,
    totalPurchases: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, CUSTOMERS_COL), data);
  return { id: docRef.id, ...data };
}

/**
 * Get a single customer by ID.
 */
export async function getCustomer(id) {
  const snap = await getDoc(doc(db, CUSTOMERS_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get all customers.
 */
export async function getCustomers() {
  const q = query(
    collection(db, CUSTOMERS_COL),
    orderBy('name'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Update a customer.
 */
export async function updateCustomer(id, data) {
  const ref = doc(db, CUSTOMERS_COL, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update customer's khata balance.
 */
export async function updateKhataBalance(customerId, amount) {
  const ref = doc(db, CUSTOMERS_COL, customerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Customer not found');

  const currentBalance = snap.data().khataBalance || 0;
  await updateDoc(ref, {
    khataBalance: currentBalance + amount,
    updatedAt: serverTimestamp(),
  });
}
