import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STORE_SETTINGS_DOC = 'settings/store_info';

export async function getStoreSettings() {
  try {
    const snap = await getDoc(doc(db, STORE_SETTINGS_DOC));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.error('Failed to get store settings:', err);
  }
  
  return {
    name: 'MADHAN MOHAN & SONS',
    address: 'Main Market, Delhi 110001',
    phone: '+91 98765 43210',
    gstin: '07AABCU9603R1ZM',
    logoUrl: '/applogo.png',
    upiId: ''
  };
}

export async function saveStoreSettings(data) {
  await setDoc(doc(db, STORE_SETTINGS_DOC), data, { merge: true });
}
