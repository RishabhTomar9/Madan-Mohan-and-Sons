import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../services/customerService';
import UnifiedCustomerSearch from '../components/billing/UnifiedCustomerSearch';
import EmptyState from '../components/ui/EmptyState';
import { Users } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCustomerSelected = (customer) => {
    if (customer && customer.id) {
      navigate(`/customers/${customer.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
      </div>

      <UnifiedCustomerSearch 
        onCustomerSelected={handleCustomerSelected} 
        selectedCustomer={null} 
        onClear={() => {}} 
      />

      <h2 className="font-semibold text-slate-700 mt-6 mb-2">Recent Customers</h2>
      
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" description="Customers will appear here as you create bills or add them above." />
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{c.name || 'Unnamed Customer'}</p>
                  <p className="text-xs text-slate-500">{(c.normalizedMobile && c.normalizedMobile !== '+') ? c.normalizedMobile : c.phone}</p>
                </div>
                {c.khataBalance !== 0 && (
                  <p className={`text-sm font-bold ${c.khataBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    Khata: {formatCurrency(Math.abs(c.khataBalance))}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
