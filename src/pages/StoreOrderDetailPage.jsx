import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function StoreOrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetch = async () => {
      try {
        const data = await getOrder(id);
        if (data && data.customerId === user.uid) {
          setOrder(data);
        } else {
          navigate('/store/orders'); // Not found or not authorized
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user, navigate]);

  if (loading) return <FullPageSpinner />;
  if (!order) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="warning"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'accepted': return <Badge variant="info"><CheckCircle size={12} className="mr-1" /> Accepted</Badge>;
      case 'dispatched': return <Badge variant="info"><Truck size={12} className="mr-1" /> Dispatched</Badge>;
      case 'delivered': return <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Delivered</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { id: 'pending', label: 'Order Placed', icon: Package },
      { id: 'accepted', label: 'Accepted', icon: CheckCircle },
      { id: 'dispatched', label: 'Dispatched', icon: Truck },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle },
    ];

    const currentStatusIndex = steps.findIndex(s => s.id === order.status);
    
    return (
      <div className="relative flex justify-between">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: currentStatusIndex === -1 ? '0%' : `${(currentStatusIndex / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step, idx) => {
          const isCompleted = currentStatusIndex >= idx;
          const isCurrent = currentStatusIndex === idx;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                isCompleted ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                <Icon size={20} />
              </div>
              <span className={`text-xs font-semibold ${isCurrent ? 'text-indigo-900' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/store/orders')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <ArrowLeft size={20} /> Back to Orders
          </button>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-10 space-y-6">
        
        {/* Order Info & Tracking */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
              <p className="text-slate-500 mt-1">Placed on {formatDateTime(order.createdAt)}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-slate-500 mb-1">Total Amount</p>
              <p className="text-2xl font-extrabold text-indigo-600">{formatCurrency(order.grandTotal)}</p>
            </div>
          </div>

          {order.status !== 'cancelled' ? (
            <div className="py-6 px-4 md:px-8 bg-slate-50 rounded-2xl border border-slate-100">
              {getStatusSteps()}
            </div>
          ) : (
            <div className="py-4 px-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-medium text-center">
              This order has been cancelled.
            </div>
          )}
        </div>

        {/* Address & Payment */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-indigo-600" /> Shipping Details
            </h2>
            <div className="text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-900">{order.customerName}</p>
              <p>{order.customerPhone}</p>
              <p className="mt-2">{order.shippingAddress?.address}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.pincode}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Truck size={20} className="text-indigo-600" /> Order Summary
            </h2>
            <div className="space-y-3 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-medium text-slate-900 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="font-medium text-slate-900">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-medium text-slate-900">{formatCurrency(order.deliveryFee)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Items in your order</h2>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                  <Package className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm line-clamp-2">{item.name}</p>
                  <p className="text-sm text-slate-500 mt-1">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <div className="font-bold text-slate-900">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
