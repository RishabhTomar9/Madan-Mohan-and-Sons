import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { INVOICE_PREFIX } from '../utils/constants';

const ORDERS_COL = 'orders';

import { addNotification } from './notificationService';
import { getOwners } from './userService';
import { checkDuplicateCustomer, quickCreateCustomer } from './customerService';

/**
 * Place a new customer order.
 */
export async function createOrder(data) {
  const orderData = {
    ...data,
    status: 'pending',
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ORDERS_COL), orderData);

  // Sync to POS Customer Database
  try {
    if (data.customerPhone) {
      const existingCustomer = await checkDuplicateCustomer(data.customerPhone, data.customerId);
      if (!existingCustomer) {
        await quickCreateCustomer(
          data.customerName || 'Online Customer',
          data.customerPhone,
          data.shippingAddress?.address || '',
          data.shippingAddress?.city || '',
          data.customerId
        );
      }
    }
  } catch (err) {
    console.error('Failed to sync customer to POS:', err);
  }
  
  // Notify owners
  try {
    const owners = await getOwners();
    for (const owner of owners) {
      await addNotification(owner.id, 'New Order Received', `Order ${orderData.orderNumber} placed for ₹${orderData.totalAmount || orderData.grandTotal}`, 'info');
    }
  } catch (err) {
    console.error('Failed to notify owners:', err);
  }

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
