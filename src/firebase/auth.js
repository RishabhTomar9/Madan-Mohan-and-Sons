import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

/**
 * Sign in with Google popup.
 * Creates/updates user doc in Firestore.
 * Super admin gets 'owner' role automatically.
 * New users get 'customer' role.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // New user — determine role
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

    // Existing user — update last login
    const userData = userSnap.data();
    await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });

    return { user, role: userData.role, isNewUser: false };
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
      return null; // silently ignore — happens when user clicks login button multiple times
    }
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
