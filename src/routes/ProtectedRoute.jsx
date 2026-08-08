import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_PERMISSIONS } from '../utils/constants';
import { FullPageSpinner } from '../components/ui/Spinner';

/**
 * ProtectedRoute — guards routes based on authentication and permissions.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The page to render
 * @param {string} [props.permission] - Required permission (e.g., 'billing')
 * @param {string[]} [props.roles] - Allowed roles (e.g., ['owner', 'manager'])
 * @param {boolean} [props.staffOnly] - If true, only staff roles can access
 */
export default function ProtectedRoute({ children, permission, roles, staffOnly = false }) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User data not loaded yet (still fetching from Firestore)
  if (!userData) {
    return <FullPageSpinner />;
  }

  // Check staff-only
  if (staffOnly && !['owner', 'manager', 'cashier'].includes(userData.role)) {
    return <Navigate to="/store" replace />;
  }

  // Check specific roles
  if (roles && !roles.includes(userData.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission
  if (permission) {
    const userPermissions = ROLE_PERMISSIONS[userData.role] || [];
    if (!userPermissions.includes(permission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
