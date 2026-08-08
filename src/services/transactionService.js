import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCustomer } from './customerService';

const TRANSACTIONS_COL = 'khata_transactions';
const CUSTOMERS_COL = 'customers';

/**
 * Add a new Khata transaction for a customer.
 * Uses a transaction to ensure customer balance and ledger entry are consistent.
 * 
 * @param {string} customerId 
 * @param {object} data - { amount, type ('give' or 'take'), description, refId }
 * @param {object} createdBy - { uid, name }
 */
export async function addKhataTransaction(customerId, data, createdBy) {
  const customerRef = doc(db, CUSTOMERS_COL, customerId);
  const transactionRef = doc(collection(db, TRANSACTIONS_COL));
  
  // 'give' = shop gives goods/cash to customer (customer balance increases, receivable increases)
  // 'take' = shop takes cash from customer (customer balance decreases, receivable decreases)
  const balanceChange = data.type === 'give' ? Math.abs(data.amount) : -Math.abs(data.amount);

  await runTransaction(db, async (transaction) => {
    const customerDoc = await transaction.get(customerRef);
    if (!customerDoc.exists()) {
      throw new Error('Customer does not exist!');
    }

    const currentBalance = customerDoc.data().khataBalance || 0;
    const newBalance = currentBalance + balanceChange;

    // Update customer balance
    transaction.update(customerRef, {
      khataBalance: newBalance,
      updatedAt: serverTimestamp()
    });

    // Create ledger entry
    transaction.set(transactionRef, {
      customerId,
      amount: Math.abs(data.amount),
      type: data.type,
      balanceAfter: newBalance,
      description: data.description || '',
      refId: data.refId || null, // Can link to an invoice ID
      createdBy,
      createdAt: serverTimestamp(),
    });
  });

  return transactionRef.id;
}

/**
 * Get all transactions for a specific customer.
 */
export async function getCustomerTransactions(customerId, filters = {}) {
  const q = query(
    collection(db, TRANSACTIONS_COL),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(filters.limit || 100)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
