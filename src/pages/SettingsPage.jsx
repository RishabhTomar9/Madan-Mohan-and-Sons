import { useAuth } from '../contexts/AuthContext';
import { Settings } from 'lucide-react';
import Badge from '../components/ui/Badge';

export default function SettingsPage() {
  const { user, userData } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
              {user?.displayName?.[0] || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900">{user?.displayName}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge variant="info" className="mt-1">{userData?.role}</Badge>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Business Settings</h2>
        <div className="text-sm text-slate-500">
          Business info, invoice settings, tax configuration, and user management coming soon.
        </div>
      </div>
    </div>
  );
}
