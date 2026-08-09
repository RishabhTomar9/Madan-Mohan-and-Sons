import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { INVOICE_PREFIX } from '../utils/constants';
import { addKhataTransaction } from './transactionService';

const INVOICES_COL = 'invoices';
const COUNTERS_COL = 'counters';

/**
 * Generate next invoice number: MM-2026-000001
 * Uses a Firestore counter document for atomic increment.
 */
async function getNextInvoiceNumber() {
  const year = new Date().getFullYear();
  const counterRef = doc(db, COUNTERS_COL, `invoice_${year}`);

  const newNumber = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let count = 1;
    if (counterDoc.exists()) {
      count = (counterDoc.data().count || 0) + 1;
    }

    transaction.set(counterRef, { count, year }, { merge: true });
    return count;
  });

  return `${INVOICE_PREFIX}-${year}-${String(newNumber).padStart(6, '0')}`;
}



/**
 * Create a new invoice.
 */
export async function createInvoice(data) {
  const invoiceNumber = await getNextInvoiceNumber();

  const invoiceData = {
    invoiceNumber,
    ...data,
    normalizedMobile: data.customer?.normalizedMobile || '',
    shopId: 'default',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, INVOICES_COL), invoiceData);

  // If this is a khata bill for a registered customer, automatically link to KhataBook
  if (data.paymentMethod === 'khata' && data.customer?.id) {
    try {
      await addKhataTransaction(
        data.customer.id,
        {
          amount: data.grandTotal,
          type: 'give', // shop gives goods -> increases receivable
          description: `Bill #${invoiceNumber}`,
          refId: docRef.id,
        },
        data.createdBy
      );
    } catch (err) {
      console.error('Failed to link khata bill to KhataBook:', err);
      // We don't throw here to avoid failing the invoice creation
    }
  }

  return { id: docRef.id, invoiceNumber, ...data };
}

/**
 * Get an invoice by ID.
 */
export async function getInvoice(id) {
  const snap = await getDoc(doc(db, INVOICES_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get recent invoices.
 */
export async function getInvoices(filters = {}) {
  let q = query(
    collection(db, INVOICES_COL),
    orderBy('createdAt', 'desc'),
    limit(filters.limit || 50)
  );

  if (filters.status) {
    q = query(
      collection(db, INVOICES_COL),
      where('status', '==', filters.status),
      orderBy('createdAt', 'desc'),
      limit(filters.limit || 50)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Cancel/void an invoice (never hard-delete).
 */
export async function cancelInvoice(id, reason = '') {
  const ref = doc(db, INVOICES_COL, id);
  await updateDoc(ref, {
    status: 'cancelled',
    cancelReason: reason,
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get today's invoices for dashboard stats.
 */
export async function getTodayInvoices() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, INVOICES_COL),
    where('createdAt', '>=', start),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get invoices for a specific customer.
 */
export async function getCustomerInvoices(customerId) {
  // Querying without orderBy to avoid needing a composite index, sorting in memory
  const q = query(
    collection(db, INVOICES_COL),
    where('customer.id', '==', customerId)
  );

  const snap = await getDocs(q);
  const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  
  // Sort by createdAt descending
  return invoices.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });
}
