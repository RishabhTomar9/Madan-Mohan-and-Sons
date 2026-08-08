import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { INVOICE_PREFIX } from '../utils/constants';

const ORDERS_COL = 'orders';

/**
 * Place a new customer order.
 */
export async function createOrder(data) {
  const orderData = {
    ...data,
    status: 'pending', // pending, accepted, dispatched, delivered, cancelled
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ORDERS_COL), orderData);
  return { id: docRef.id, ...orderData };
}

/**
 * Get all orders (for admin dashboard).
 */
export async function getOrders(statusFilter = '') {
  let q = query(
    collection(db, ORDERS_COL),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  if (statusFilter) {
    q = query(
      collection(db, ORDERS_COL),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get orders for a specific customer.
 */
export async function getCustomerOrders(customerId) {
  const q = query(
    collection(db, ORDERS_COL),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Update order status.
 */
export async function updateOrderStatus(orderId, newStatus) {
  const ref = doc(db, ORDERS_COL, orderId);
  await updateDoc(ref, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
}

/**
 * Get a single order.
 */
export async function getOrder(id) {
  const snap = await getDoc(doc(db, ORDERS_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
