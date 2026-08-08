import { useState, useEffect } from 'react';
import { getInventoryTransactions, getProducts } from '../services/productService';
import { formatDateTime } from '../utils/date';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Warehouse, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function InventoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [txData, prodData] = await Promise.all([
          getInventoryTransactions(),
          getProducts()
        ]);
        setTransactions(txData);
        setProducts(prodData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <FullPageSpinner />;

  const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Products" value={products.length} icon={Warehouse} color="blue" />
        <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} color="amber" />
        <StatCard title="Out of Stock" value={outOfStockCount} icon={AlertTriangle} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
        </div>

        {transactions.length === 0 ? (
          <EmptyState 
            icon={Warehouse} 
            title="No inventory history" 
            description="Inventory changes will appear here when you add stock or generate bills." 
          />
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {tx.type === 'in' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tx.productName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tx.reason} • {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={tx.type === 'in' ? 'success' : 'warning'} className="text-sm">
                    {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">Bal: {tx.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
