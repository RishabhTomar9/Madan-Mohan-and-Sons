import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save, Image as ImageIcon, Users, UserCog, Check } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import { getStoreSettings, saveStoreSettings } from '../services/settingsService';
import { getAllUsers, updateUserAccess } from '../services/userService';
import { ROLE_PERMISSIONS, ROLES } from '../utils/constants';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    phone: '',
    gstin: '',
    logoUrl: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getStoreSettings();
        setSettings(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveStoreSettings(settings);
      alert('Store settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
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

      {/* Store Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Store Information (Billing Header)</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading settings...</p>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input 
                label="Store Name" 
                value={settings.name} 
                onChange={(e) => setSettings({...settings, name: e.target.value})} 
                required 
              />
              <Input 
                label="Phone Number" 
                value={settings.phone} 
                onChange={(e) => setSettings({...settings, phone: e.target.value})} 
              />
              <Input 
                label="Address" 
                value={settings.address} 
                onChange={(e) => setSettings({...settings, address: e.target.value})} 
                className="sm:col-span-2"
              />
              <Input 
                label="GSTIN" 
                value={settings.gstin} 
                onChange={(e) => setSettings({...settings, gstin: e.target.value})} 
              />
              <Input 
                label="UPI ID (for QR Code)" 
                placeholder="e.g. yourname@upi"
                value={settings.upiId || ''} 
                onChange={(e) => setSettings({...settings, upiId: e.target.value})} 
              />
              <Input 
                label="Logo URL" 
                placeholder="e.g. /applogo.png or https://..."
                value={settings.logoUrl} 
                onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} 
              />
            </div>
            
            <div className="pt-2 flex justify-end">
              <Button type="submit" icon={Save} loading={saving}>
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* User Management Section (Owner Only) */}
      {userData?.role === 'owner' && <UserManagementSection />}
    </div>
  );
}

function UserManagementSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({
      ...user,
      tempRole: user.role || 'customer',
      tempPermissions: user.customPermissions || ROLE_PERMISSIONS[user.role || 'customer'] || []
    });
  };

  const handleSavePermissions = async () => {
    try {
      await updateUserAccess(editingUser.id, editingUser.tempRole, editingUser.tempPermissions);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update user access');
    }
  };

  const togglePermission = (perm) => {
    setEditingUser(prev => {
      const perms = prev.tempPermissions || [];
      if (perms.includes(perm)) {
        return { ...prev, tempPermissions: perms.filter(p => p !== perm) };
      } else {
        return { ...prev, tempPermissions: [...perms, perm] };
      }
    });
  };

  // Get all possible features (using owner's list as the master list)
  const allFeatures = ROLE_PERMISSIONS[ROLES.OWNER];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Users size={20} className="text-indigo-600" />
          User Management
        </h2>
        <Button variant="outline" size="sm" onClick={fetchUsers}>Refresh</Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading users...</p>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                    {u.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 leading-tight truncate">{u.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <Badge variant={u.role === 'owner' ? 'success' : u.role === 'customer' ? 'default' : 'info'}>
                  {u.role}
                </Badge>
                {u.customPermissions && u.customPermissions.length > 0 && (
                  <Badge variant="warning">Custom Access</Badge>
                )}
                <button 
                  onClick={() => handleEdit(u)}
                  disabled={u.role === 'owner'} 
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 ml-1"
                  title="Manage Access"
                >
                  <UserCog size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Access Modal */}
      {editingUser && (
        <Modal isOpen={true} onClose={() => setEditingUser(null)} title="Manage User Access">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              {editingUser.photoURL ? (
                <img src={editingUser.photoURL} alt="" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg">
                  {editingUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{editingUser.displayName}</p>
                <p className="text-sm text-slate-500">{editingUser.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Base Role</label>
              <Dropdown 
                value={editingUser.tempRole}
                onChange={(val) => setEditingUser({...editingUser, tempRole: val})}
                options={[
                  { value: 'customer', label: 'Customer / Standard User' },
                  { value: 'cashier', label: 'Cashier' },
                  { value: 'manager', label: 'Manager' }
                ]}
              />
              <p className="text-xs text-slate-500 mt-1">Changing the base role resets default permissions.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Custom Feature Access</label>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {allFeatures.map(feature => {
                  const hasAccess = editingUser.tempPermissions?.includes(feature);
                  return (
                    <label 
                      key={feature} 
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        hasAccess ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        hasAccess ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                      }`}>
                        {hasAccess && <Check size={14} className="text-white" />}
                      </div>
                      <span className={`text-sm font-medium capitalize ${hasAccess ? 'text-indigo-900' : 'text-slate-600'}`}>
                        {feature.replace('_', ' ')}
                      </span>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={hasAccess}
                        onChange={() => togglePermission(feature)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={handleSavePermissions}>Save Access</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
