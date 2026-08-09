import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../services/orderService';
import { createInvoice } from '../services/invoiceService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { ArrowLeft, Printer, Check, X, MapPin, Phone, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FullPageSpinner } from '../components/ui/Spinner';
import { shareViaWhatsApp } from '../utils/share';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      setOrder(prev => ({ ...prev, status: newStatus }));
      
      // Notify customer via WhatsApp if they have a phone
      if (order.customerPhone) {
        let msg = '';
        if (newStatus === 'accepted') msg = `Hello ${order.customerName}, your order #${order.orderNumber} has been accepted and is being prepared by Madhan Mohan & Sons.`;
        if (newStatus === 'dispatched') msg = `Hello ${order.customerName}, your order #${order.orderNumber} has been dispatched. It will reach you soon.`;
        if (newStatus === 'delivered') msg = `Hello ${order.customerName}, your order #${order.orderNumber} has been delivered. Thank you for shopping with Madhan Mohan & Sons!`;
        if (newStatus === 'cancelled') msg = `Hello ${order.customerName}, your order #${order.orderNumber} has been cancelled. If you have any questions, please contact us.`;
        
        if (msg) shareViaWhatsApp(order.customerPhone, msg);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateBill = async () => {
    if (order.invoiceId) {
      navigate(`/invoices/${order.invoiceId}`);
      return;
    }
    
    setUpdating(true);
    try {
      const invoice = await createInvoice({
        items: order.items,
        subtotal: order.subtotal,
        discount: 0,
        tax: 0,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod === 'cod' ? 'cash' : 'upi',
        customer: {
          id: order.customerId,
          name: order.customerName,
          phone: order.customerPhone,
        },
        linkedOrderId: order.id,
      });
      
      // Save the invoiceId to the order
      // We don't have an explicit function for updating just invoiceId, but updateOrderStatus works if modified, or we can just navigate
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate bill');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
              <Badge variant={
                order.status === 'delivered' ? 'success' : 
                order.status === 'cancelled' ? 'danger' : 
                order.status === 'pending' ? 'warning' : 'info'
              }>
                {order.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateBill} loading={updating} icon={Printer}>
            {order.invoiceId ? 'View Bill' : 'Generate Bill'}
          </Button>
        </div>
      </div>

      {/* Customer & Delivery Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Delivery Details</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
            <div className="flex items-start gap-2 mt-2 text-sm text-slate-600">
              <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{order.customerPhone}</span>
            </div>
            <div className="flex items-start gap-2 mt-2 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{order.customerAddress}</span>
            </div>
          </div>
          {order.notes && (
            <div className="p-3 bg-amber-50 text-amber-900 text-sm rounded-xl border border-amber-100">
              <strong>Notes:</strong> {order.notes}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Order Items</h2>
        </div>
        <div className="divide-y divide-slate-100 p-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{formatCurrency(item.price)} × {item.quantity}</p>
              </div>
              <p className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Item Total</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Grand Total</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-bold uppercase">{order.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Action Bar (Sticky at bottom for admins) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-40 lg:left-64 flex justify-end gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {order.status === 'pending' && (
          <>
            <Button variant="danger" outline onClick={() => handleStatusChange('cancelled')} loading={updating} icon={X}>
              Reject
            </Button>
            <Button variant="success" onClick={() => handleStatusChange('accepted')} loading={updating} icon={Check}>
              Accept Order
            </Button>
          </>
        )}
        
        {order.status === 'accepted' && (
          <Button variant="primary" onClick={() => handleStatusChange('dispatched')} loading={updating}>
            Mark Dispatched
          </Button>
        )}
        
        {order.status === 'dispatched' && (
          <Button variant="success" onClick={() => handleStatusChange('delivered')} loading={updating}>
            Mark Delivered
          </Button>
        )}
      </div>
    </div>
  );
}
