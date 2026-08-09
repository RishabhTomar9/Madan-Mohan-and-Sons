import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save, Image as ImageIcon } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getStoreSettings, saveStoreSettings } from '../services/settingsService';

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
    </div>
  );
}
