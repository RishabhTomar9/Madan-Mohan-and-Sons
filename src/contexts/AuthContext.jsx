import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, getUserData } from '../firebase';
import { ROLE_PERMISSIONS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const data = await getUserData(firebaseUser.uid);
          setUser(firebaseUser);
          setUserData(data);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser(firebaseUser);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setUserData((prev) => ({ ...prev, role: result.role }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setUserData(null);
    } catch (err) {
      setError('Failed to sign out. Please try again.');
    }
  };

  const hasPermission = (permission) => {
    if (!userData?.role) return false;
    const permissions = ROLE_PERMISSIONS[userData.role] || [];
    return permissions.includes(permission);
  };

  const isStaff = () => {
    if (!userData?.role) return false;
    return ['owner', 'manager', 'cashier'].includes(userData.role);
  };

  const value = {
    user,
    userData,
    loading,
    error,
    login,
    logout,
    hasPermission,
    isStaff,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
