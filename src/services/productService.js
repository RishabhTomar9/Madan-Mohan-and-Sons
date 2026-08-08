import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';

const PRODUCTS_COL = 'products';
const CATEGORIES_COL = 'categories';
const INVENTORY_TX_COL = 'inventory_transactions';

// ================= Categories =================

export async function getCategories() {
  const q = query(collection(db, CATEGORIES_COL), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCategory(name) {
  const data = { name, createdAt: serverTimestamp() };
  const docRef = await addDoc(collection(db, CATEGORIES_COL), data);
  return { id: docRef.id, ...data };
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, CATEGORIES_COL, id));
}

// ================= Products =================

export async function getProducts(filters = {}) {
  let q = query(collection(db, PRODUCTS_COL), orderBy('name'));
  
  if (filters.category) {
    q = query(collection(db, PRODUCTS_COL), where('categoryId', '==', filters.category), orderBy('name'));
  }
  
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, PRODUCTS_COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createProduct(data) {
  const productData = {
    ...data,
    stockQuantity: Number(data.stockQuantity) || 0,
    price: Number(data.price) || 0,
    purchasePrice: Number(data.purchasePrice) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, PRODUCTS_COL), productData);
  
  // Log initial inventory
  if (productData.stockQuantity > 0) {
    await addDoc(collection(db, INVENTORY_TX_COL), {
      productId: docRef.id,
      productName: data.name,
      type: 'in',
      quantity: productData.stockQuantity,
      reason: 'Initial Stock',
      createdAt: serverTimestamp(),
    });
  }
  
  return { id: docRef.id, ...productData };
}

export async function updateProduct(id, data) {
  const ref = doc(db, PRODUCTS_COL, id);
  await updateDoc(ref, {
    ...data,
    price: data.price !== undefined ? Number(data.price) : undefined,
    purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : undefined,
    updatedAt: serverTimestamp()
  });
}

// ================= Inventory =================

export async function updateInventory(productId, quantityChange, type, reason, createdBy) {
  const productRef = doc(db, PRODUCTS_COL, productId);
  const txRef = doc(collection(db, INVENTORY_TX_COL));
  
  await runTransaction(db, async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists()) throw new Error('Product not found');
    
    const currentStock = productDoc.data().stockQuantity || 0;
    const newStock = type === 'in' ? currentStock + quantityChange : currentStock - quantityChange;
    
    transaction.update(productRef, {
      stockQuantity: newStock,
      updatedAt: serverTimestamp()
    });
    
    transaction.set(txRef, {
      productId,
      productName: productDoc.data().name,
      type,
      quantity: quantityChange,
      balanceAfter: newStock,
      reason,
      createdBy,
      createdAt: serverTimestamp()
    });
  });
}

export async function getInventoryTransactions(limitCount = 100) {
  const q = query(
    collection(db, INVENTORY_TX_COL),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
