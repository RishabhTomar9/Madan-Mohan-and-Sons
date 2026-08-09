import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, or,
} from 'firebase/firestore';
import { db } from '../firebase';

const CUSTOMERS_COL = 'customers';

/**
 * Normalizes an Indian mobile number.
 * E.g., '9876543210', '+919876543210', '919876543210' -> '+919876543210'
 */
export function normalizeMobile(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return '+91' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return '+' + cleaned;
  return '+' + cleaned; // Fallback
}

/**
 * Search customers heavily prioritizing normalized mobile.
 */
export async function searchCustomers(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const term = searchTerm.toLowerCase();
  
  // If the user typed digits, try to normalize and search by normalizedMobile
  const isNumeric = /^[0-9+\-\s()]+$/.test(searchTerm);
  
  let q;
  if (isNumeric && searchTerm.replace(/\D/g, '').length >= 3) {
    // Basic search on normalizedMobile (prefix or exact match depending on input)
    // Firestore doesn't do substring on strings easily without external engines, 
    // but we can query by prefix if we assume they type the start of the number.
    // However, it's safer to just fetch customers (limit 100) and filter in memory for robust partial matches.
    q = query(collection(db, CUSTOMERS_COL), limit(100));
  } else {
    q = query(collection(db, CUSTOMERS_COL), orderBy('name'), limit(50));
  }

  const snap = await getDocs(q);
  const normalizedSearch = normalizeMobile(searchTerm);

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => {
      const matchName = c.name?.toLowerCase().includes(term);
      const matchRawPhone = c.phone?.includes(searchTerm);
      const matchNormalized = c.normalizedMobile && normalizedSearch && c.normalizedMobile.includes(normalizedSearch.replace('+91', ''));
      return matchName || matchRawPhone || matchNormalized;
    });
}

/**
 * Check if a customer exists with this normalized mobile.
 */
export async function checkDuplicateCustomer(phone) {
  const norm = normalizeMobile(phone);
  if (!norm) return null;

  const q = query(
    collection(db, CUSTOMERS_COL),
    where('normalizedMobile', '==', norm),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  return null;
}

/**
 * Quick-create a customer during billing.
 */
export async function quickCreateCustomer(name, phone = '', address = '', city = '') {
  const norm = normalizeMobile(phone);

  const data = {
    name,
    phone,
    normalizedMobile: norm,
    email: '',
    address,
    city,
    gstin: '',
    shopId: 'default',
    khataBalance: 0,
    totalPurchases: 0,
    totalBills: 0,
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

export async function updateCustomer(id, data) {
  const ref = doc(db, CUSTOMERS_COL, id);
  const updates = { ...data, updatedAt: serverTimestamp() };
  if (data.phone !== undefined) {
    updates.normalizedMobile = normalizeMobile(data.phone);
  }
  await updateDoc(ref, updates);
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
