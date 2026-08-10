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
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await processUserDoc(result.user);
  } catch (error) {
    // If popup is blocked or web storage is unsupported (common in some mobile browsers/in-app browsers)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/web-storage-unsupported') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // Page will redirect, execution stops
      } catch (redirectError) {
        console.error('Failed to trigger redirect login:', redirectError);
        throw new Error('Failed to start login. Please check your browser settings.');
      }
    }
    
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      return null; // User closed the popup, don't throw an error
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    console.error('Sign-in error:', error);
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
