import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getCustomerTransactions } from '../services/transactionService';
import { getStoreSettings } from '../services/settingsService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function CustomerKhataView() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKhata = async () => {
      if (!user) return;
      try {
        // Fetch store settings for UPI ID
        const storeSettings = await getStoreSettings();
        setSettings(storeSettings);

        // Fetch customer profile matching user ID
        const q = query(collection(db, 'customers'), where('userId', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const custData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setCustomer(custData);
          
          // Fetch their transactions
          const txData = await getCustomerTransactions(custData.id);
          setTransactions(txData);
        }
      } catch (err) {
        console.error('Error fetching khata for customer:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKhata();
  }, [user]);

  if (loading) return <FullPageSpinner />;

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">No Khata Found</h1>
        <p className="text-slate-500">Your account is not linked to any Khata ledger.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
      <div className="text-center py-4 space-y-2">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <Building2 size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{settings?.storeName || 'Store Name'}</h1>
        <p className="text-slate-500 text-sm">Digital Khata Ledger for {customer.name}</p>
      </div>

      {/* Balance Card */}
      <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm ${
        customer.khataBalance > 0 ? 'bg-red-50 border-red-100 text-red-900' :
        customer.khataBalance < 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
        'bg-slate-50 border-slate-200 text-slate-900'
      }`}>
        <div>
          <p className="text-sm font-medium opacity-80">Net Balance</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {formatCurrency(Math.abs(customer.khataBalance || 0))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold bg-white/50 px-3 py-1.5 rounded-lg inline-block">
            {customer.khataBalance > 0 ? 'You will give' :
             customer.khataBalance < 0 ? 'You will get' : 'Settled'}
          </p>
        </div>
      </div>

      {/* Payment Details if customer needs to pay */}
      {customer.khataBalance > 0 && settings?.upiId && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
          <p className="text-sm text-slate-500 mb-2">Clear your dues by paying via UPI to:</p>
          <p className="font-bold text-lg text-slate-900 select-all">{settings.upiId}</p>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-900">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No transactions found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                <div className="shrink-0 mt-1">
                  {/* Note: from the customer's perspective, if the store "gave", the customer "got", and vice-versa */}
                  {tx.type === 'give' ? (
                    <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                      <ArrowDownLeft size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <ArrowUpRight size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {tx.type === 'give' ? 'You Got' : 'You Gave'}
                  </p>
                  {tx.description && <p className="text-sm text-slate-600 mt-0.5">{tx.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(tx.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-base font-bold ${tx.type === 'give' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                    Bal: {formatCurrency(Math.abs(tx.balanceAfter))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
