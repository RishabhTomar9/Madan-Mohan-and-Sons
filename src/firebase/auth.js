import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

async function processUserDoc(user) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const role = user.email === SUPER_ADMIN_EMAIL ? 'owner' : 'customer';
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { user, role, isNewUser: true };
  }

  const userData = userSnap.data();
  await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
  return { user, role: userData.role, isNewUser: false };
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      await processUserDoc(result.user);
    }
  } catch (error) {
    console.error('Redirect sign-in error:', error);
    throw new Error('Authentication failed after redirect. Please try again.');
  }
}

export async function signInWithGoogle() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    try {
      await signInWithRedirect(auth, googleProvider);
      return null; // Page will redirect, execution stops
    } catch (error) {
      console.error('Failed to trigger redirect login:', error);
      throw new Error('Failed to start mobile login. Please check your browser settings.');
    }
  }

  // Desktop flow (Popup)
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await processUserDoc(result.user);
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups and try again.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      return null;
    }
    console.error('Popup sign-in error:', error);
    throw new Error('Authentication failed. Please try again.');
  }
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  await firebaseSignOut(auth);
}

/**
 * Get the current user's data from Firestore.
 */
export async function getUserData(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

/**
 * Update a user's role (only owner can do this).
 */
export async function updateUserRole(uid, newRole) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
