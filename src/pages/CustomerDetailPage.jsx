import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, getCustomers } from '../services/customerService';
import { getCustomerTransactions } from '../services/transactionService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { ArrowLeft, User, Phone, MapPin, Mail, BookOpen } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';
import Button from '../components/ui/Button';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [custData, txData] = await Promise.all([
          getCustomer(id),
          getCustomerTransactions(id, { limit: 10 })
        ]);
        setCustomer(custData);
        setTransactions(txData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <FullPageSpinner />;
  if (!customer) return <div className="p-8 text-center">Customer not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-200">
          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold shadow-sm">
            {customer.name[0]?.toUpperCase()}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{customer.name}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {customer.phone && <p className="flex items-center justify-center sm:justify-start gap-2"><Phone size={16} className="text-slate-400"/> {customer.phone}</p>}
              {customer.email && <p className="flex items-center justify-center sm:justify-start gap-2"><Mail size={16} className="text-slate-400"/> {customer.email}</p>}
              {customer.address && <p className="flex items-center justify-center sm:justify-start gap-2"><MapPin size={16} className="text-slate-400"/> {customer.address}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/khatabook/${customer.id}`)} icon={BookOpen}>
              Khata Ledger
            </Button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-500">Khata Balance</p>
            <p className={`text-xl font-bold mt-1 ${customer.khataBalance > 0 ? 'text-red-600' : customer.khataBalance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatCurrency(Math.abs(customer.khataBalance || 0))}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-500">Total Purchases</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(customer.totalPurchases || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
