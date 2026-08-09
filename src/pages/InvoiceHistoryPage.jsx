import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices } from '../services/invoiceService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { FileText, Receipt } from 'lucide-react';

export default function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getInvoices();
        setInvoices(data);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filtered = invoices.filter((inv) =>
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status) => {
    const map = { paid: 'success', pending: 'warning', cancelled: 'danger' };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." />

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create your first bill to see your invoices here."
          actionLabel="Create Bill"
          onAction={() => navigate('/billing')}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <button
              key={inv.id}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{inv.invoiceNumber}</p>
                  <p className="text-sm text-slate-500">
                    {inv.customer?.name || 'Walk-in'}
                    {inv.customer && (inv.customer.normalizedMobile || inv.customer.phone) && (
                      <span className="ml-1 text-xs">
                        • {((inv.customer.normalizedMobile && inv.customer.normalizedMobile !== '+') ? inv.customer.normalizedMobile : inv.customer.phone)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</p>
                  {statusBadge(inv.status)}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{formatDateTime(inv.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
