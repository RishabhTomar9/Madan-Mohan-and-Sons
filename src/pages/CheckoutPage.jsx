import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../services/orderService';
import { formatCurrency } from '../utils/currency';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowLeft, MapPin, CheckCircle, Smartphone } from 'lucide-react';
import Modal from '../components/ui/Modal';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    pincode: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod or upi
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const total = getTotal();
  const deliveryFee = total > 500 ? 0 : 50;
  const grandTotal = total + deliveryFee;

  // If cart is empty and no success, redirect to store
  if (items.length === 0 && !orderSuccess) {
    navigate('/store');
    return null;
  }

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;

    setLoading(true);
    try {
      const order = await createOrder({
        customerId: user.uid,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: `${formData.address}, ${formData.pincode}`,
        notes: formData.notes,
        items,
        subtotal: total,
        deliveryFee,
        grandTotal,
        paymentMethod,
      });

      setOrderSuccess(order);
      clearCart();
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Placed!</h1>
            <p className="text-sm text-slate-500 mt-2">
              Your order #{orderSuccess.orderNumber} has been received.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount to pay</span>
              <span className="font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment method</span>
              <span className="font-medium text-slate-900 uppercase">{paymentMethod}</span>
            </div>
          </div>
          <Button fullWidth size="lg" onClick={() => navigate('/store')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Form */}
        <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" /> Delivery Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit number" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Complete Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="House/Flat No, Building Name, Street..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">PIN Code</label>
                <Input name="pincode" value={formData.pincode} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Delivery Notes (Optional)</label>
                <Input name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g. Leave with guard" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Smartphone size={18} className="text-indigo-600" /> Payment Method
            </h2>
            
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Cash on Delivery</p>
                  <p className="text-xs text-slate-500">Pay when your order arrives</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Pay via UPI</p>
                  <p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm</p>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">Order Summary</h2>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {items.map(item => (
                <div key={item.productId} className="py-2 flex justify-between text-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-slate-900 font-medium truncate">{item.name}</p>
                    <p className="text-slate-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-900 shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Item Total</span>
                <span className="font-medium text-slate-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivery Fee</span>
                <span className={deliveryFee === 0 ? "font-medium text-emerald-600" : "font-medium text-slate-900"}>
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-[10px] text-slate-400 text-right">Free delivery above {formatCurrency(500)}</p>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span>To Pay</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <Button form="checkout-form" type="submit" fullWidth size="lg" loading={loading} className="!rounded-xl shadow-lg shadow-indigo-200">
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
