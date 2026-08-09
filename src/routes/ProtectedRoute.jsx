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
  const { user, userData, loading, error, isStaff, hasPermission } = useAuth();

  if (loading) {
    return <FullPageSpinner />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle fatal database errors during user fetch
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 max-w-sm text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-2 bg-indigo-600 text-white rounded-xl font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // User data not loaded yet (still fetching from Firestore)
  if (!userData) {
    return <FullPageSpinner />;
  }

  // Check staff-only
  if (staffOnly && !isStaff()) {
    return <Navigate to="/store" replace />;
  }

  // Check specific roles
  if (roles && !roles.includes(userData.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
