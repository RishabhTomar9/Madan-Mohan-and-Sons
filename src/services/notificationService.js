import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';

const NOTIFICATIONS_COL = 'notifications';

export async function addNotification(userId, title, message, type = 'info') {
  const notificationData = {
    userId,
    title,
    message,
    type, // 'info', 'success', 'warning', 'error'
    isRead: false,
    createdAt: serverTimestamp(),
  };
  
  await addDoc(collection(db, NOTIFICATIONS_COL), notificationData);
}

export async function getUserNotifications(userId, limitCount = 50) {
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    where('userId', '==', userId),
    limit(limitCount)
  );
  
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Sort client-side to avoid requiring a composite index in Firestore
  data.sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });
  
  return data;
}

export async function getUnreadNotificationsCount(userId) {
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  
  const snap = await getDocs(q);
  return snap.size;
}

export async function markNotificationAsRead(notificationId) {
  const ref = doc(db, NOTIFICATIONS_COL, notificationId);
  await updateDoc(ref, {
    isRead: true,
    updatedAt: serverTimestamp()
  });
}

export async function markAllAsRead(userId) {
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => 
    updateDoc(doc(db, NOTIFICATIONS_COL, d.id), { isRead: true, updatedAt: serverTimestamp() })
  );
  
  await Promise.all(promises);
}
