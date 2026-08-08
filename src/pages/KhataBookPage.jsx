import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import { BookOpen, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { getCustomers } from '../services/customerService';

export default function KhataBookPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data.filter((c) => c.khataBalance !== 0));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalReceivable = customers.filter((c) => c.khataBalance > 0).reduce((s, c) => s + c.khataBalance, 0);
  const totalPayable = customers.filter((c) => c.khataBalance < 0).reduce((s, c) => s + Math.abs(c.khataBalance), 0);

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">KhataBook</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Receivable" value={formatCurrency(totalReceivable)} icon={ArrowDownLeft} color="emerald" />
        <StatCard title="Total Payable" value={formatCurrency(totalPayable)} icon={ArrowUpRight} color="red" />
        <StatCard title="Overdue" value={formatCurrency(0)} icon={AlertTriangle} color="amber" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No credit entries" description="Credit entries will appear here when customers buy on credit." />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/khatabook/${c.id}`)}
              className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-sm transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{c.name}</p>
                {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
              </div>
              <div className="text-right">
                <p className={`font-bold ${c.khataBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {c.khataBalance > 0 ? 'You will receive' : 'You will pay'}
                </p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(Math.abs(c.khataBalance))}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
