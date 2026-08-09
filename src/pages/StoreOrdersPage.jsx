import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerOrders } from '../services/orderService';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { Package, ArrowLeft, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function StoreOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetch = async () => {
      try {
        const data = await getCustomerOrders(user.uid);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, navigate]);

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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate('/store')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <ArrowLeft size={20} /> Back to Store
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {orders.length === 0 ? (
            <EmptyState 
              icon={Package} 
              title="No orders found" 
              description="You haven't placed any orders yet." 
              actionLabel="Start Shopping"
              onAction={() => navigate('/store')}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => navigate(`/store/orders/${order.id}`)}
                  className="p-4 sm:p-6 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                      <Package size={28} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 truncate">#{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-slate-500">Ordered on {formatDateTime(order.createdAt)}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{order.items?.length || 0} items • {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400 mb-0.5">Total Amount</p>
                      <p className="font-bold text-indigo-600 text-lg">{formatCurrency(order.grandTotal)}</p>
                    </div>
                    
                    <div className="text-slate-300">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
