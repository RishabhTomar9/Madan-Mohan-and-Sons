import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCustomer, updateCustomer } from '../services/customerService';
import Button from '../components/ui/Button';
import { LogIn, Link2 } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function KhataSyncPage() {
  const { customerId } = useParams();
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await getCustomer(customerId);
        if (!data) {
          setError('Invalid Khata Link. Customer not found.');
        } else {
          setCustomer(data);
        }
      } catch (err) {
        setError('Error fetching customer details.');
      }
    };
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  useEffect(() => {
    const syncCustomer = async () => {
      if (user && customer && !error && !syncing) {
        setSyncing(true);
        try {
          // If the customer already has a userId, don't overwrite if it's different.
          if (customer.userId && customer.userId !== user.uid) {
            setError('This Khata account is already linked to another email address.');
            return;
          }

          // Update customer with userId and email
          await updateCustomer(customerId, {
            userId: user.uid,
            email: user.email,
          });

          // Redirect to the customer's khata view
          navigate('/store/khata', { replace: true });
        } catch (err) {
          console.error('Failed to sync Khata:', err);
          setError('Failed to link your account. Please try again.');
        } finally {
          setSyncing(false);
        }
      }
    };

    syncCustomer();
  }, [user, customer, error, customerId, navigate, syncing]);

  if (authLoading || (user && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <FullPageSpinner />
        <p className="text-slate-600 font-medium">Linking your account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-sm text-center border border-red-100">
          <p className="font-bold mb-2">Link Failed</p>
          <p className="text-sm">{error}</p>
          <Button className="mt-4 w-full" variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-indigo-100/20 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Link2 size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Khata Account</h1>
        <p className="text-slate-500 mb-8">
          Sign in to view your payment details and Khata ledger for <span className="font-bold text-slate-700">{customer?.name}</span>.
        </p>

        <Button
          fullWidth
          size="lg"
          onClick={login}
          icon={LogIn}
          className="shadow-sm hover:shadow transition-all"
        >
          Sign In with Google
        </Button>
      </div>
    </div>
  );
}
