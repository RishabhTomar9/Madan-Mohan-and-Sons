import { collection, doc, getDocs, updateDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';

const USERS_COL = 'users';

export async function getAllUsers() {
  const q = query(collection(db, USERS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getOwners() {
  const q = query(collection(db, USERS_COL), where('role', '==', 'owner'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserAccess(uid, role, customPermissions = null) {
  const userRef = doc(db, USERS_COL, uid);
  const data = {
    role,
    updatedAt: serverTimestamp(),
  };
  
  if (customPermissions !== null) {
    data.customPermissions = customPermissions;
  }
  
  await updateDoc(userRef, data);
}
