import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus } from '../services/orderService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { Package, Search, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { FullPageSpinner } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Dropdown from '../components/ui/Dropdown';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getOrders(statusFilter);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="warning"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'accepted': return <Badge variant="info"><CheckCircle size={12} className="mr-1" /> Accepted</Badge>;
      case 'dispatched': return <Badge variant="info"><Truck size={12} className="mr-1" /> Dispatched</Badge>;
      case 'delivered': return <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Delivered</Badge>;
      case 'cancelled': return <Badge variant="danger"><XCircle size={12} className="mr-1" /> Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Online Orders</h1>
        
        <Dropdown 
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All Orders' },
            { value: 'pending', label: 'Pending' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'dispatched', label: 'Dispatched' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState 
            icon={Package} 
            title="No orders found" 
            description={statusFilter ? `No orders with status "${statusFilter}"` : "You haven't received any online orders yet."} 
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map(order => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/orders/${order.id}`)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <Package size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{order.customerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(order.createdAt)} • {order.items?.length || 0} items</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900">{formatCurrency(order.grandTotal)}</p>
                  <p className="text-xs text-slate-500 mt-1 uppercase">{order.paymentMethod}</p>
                </div>
                
                <div className="text-slate-400 shrink-0">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
