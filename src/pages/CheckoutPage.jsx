import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { formatCurrency } from '../utils/currency';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import { RadioGroup } from '../components/ui/RadioGroup';
import { ArrowLeft, CheckCircle2, Truck, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    pincode: '',
    city: '',
  });
  
  const [saveInfo, setSaveInfo] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (items.length === 0) {
      navigate('/store/cart');
    }
  }, [items, navigate]);

  const subtotal = getTotal();
  const grandTotal = subtotal;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place an order');
      return navigate('/login');
    }
    
    setLoading(true);
    try {
      const orderData = {
        customerId: user.uid,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: user.email,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
        },
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        tax: 0,
        deliveryFee: 0,
        grandTotal,
        paymentMethod, // 'cod' or 'online'
      };

      await createOrder(orderData);
      
      clearCart();
      toast.success('Order placed successfully!', { icon: '🎉' });
      navigate('/store/orders');
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    {
      id: 'cod',
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives.',
      rightElement: <Truck size={20} className="text-slate-400" />
    },
    {
      id: 'online',
      label: 'Pay Online (UPI / Card)',
      description: 'Securely pay using your preferred method.',
      rightElement: <CreditCard size={20} className="text-slate-400" />
    }
  ];

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate('/store/cart')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <ArrowLeft size={20} /> Back to Cart
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 flex flex-col lg:flex-row gap-8">
        {/* Left Form */}
        <div className="flex-1 space-y-8">
          
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">1</div>
              <h2 className="text-xl font-bold text-slate-900">Shipping Details</h2>
            </div>
            
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input label="Phone Number" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <Input label="Street Address" className="md:col-span-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                <Input label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                <Input label="Pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required />
              </div>
              
              <div className="pt-2">
                <Checkbox 
                  checked={saveInfo} 
                  onChange={setSaveInfo} 
                  label="Save this information for next time" 
                  description="We'll securely store this address for faster checkout." 
                />
              </div>
            </form>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">2</div>
              <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
            </div>
            
            <RadioGroup 
              value={paymentMethod} 
              onChange={setPaymentMethod} 
              options={paymentOptions} 
            />
          </div>

        </div>

        {/* Right Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-8 pt-4 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-lg">Total</span>
              <span className="font-extrabold text-indigo-600 text-2xl">{formatCurrency(grandTotal)}</span>
            </div>

            <Button 
              type="submit" 
              form="checkout-form" 
              fullWidth 
              size="lg" 
              loading={loading}
              className="!rounded-2xl shadow-xl shadow-indigo-200"
            >
              <CheckCircle2 size={18} className="mr-2" /> 
              Place Order
            </Button>
            <p className="text-xs text-center text-slate-400 mt-4">By placing your order, you agree to our Terms of Service.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
