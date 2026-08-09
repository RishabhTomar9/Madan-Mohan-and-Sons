import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCart();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    toast.success('Cart cleared successfully');
  };

  const handleUpdateQty = (item, newQty) => {
    if (newQty < 1) {
      removeItem(item.productId);
      toast('Item removed from cart', { icon: '🗑️' });
    } else {
      updateQuantity(item.productId, newQty);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 px-4 pb-10 flex items-start justify-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm w-full max-w-md text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Button fullWidth size="lg" onClick={() => navigate('/store')} className="!rounded-2xl shadow-xl shadow-indigo-200">
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getTotal();
  const total = subtotal;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/store')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <ArrowLeft size={20} /> Back to Store
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="text-sm font-medium text-red-500 hover:text-red-600">
            Clear Cart
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-10 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Shopping Cart ({items.length} items)</h1>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingCart size={32} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm sm:text-lg line-clamp-2 leading-tight mb-1">{item.name}</p>
                  <p className="text-indigo-600 font-bold sm:text-lg">{formatCurrency(item.price)}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-6 shrink-0">
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl">
                    <button onClick={() => handleUpdateQty(item, item.quantity - 1)} className="p-2 sm:p-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-l-xl transition-colors">
                      <Minus size={16} />
                    </button>
                    <span className="w-8 sm:w-10 text-center font-bold text-slate-900">{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item, item.quantity + 1)} className="p-2 sm:p-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-r-xl transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <p className="font-bold text-slate-900 w-20 text-right hidden sm:block">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sticky top-24 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
            
            <div className="border-t border-slate-100 pt-4 mb-8 flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-2xl font-extrabold text-indigo-600">{formatCurrency(total)}</span>
            </div>

            <Button fullWidth size="lg" className="!rounded-2xl shadow-xl shadow-indigo-200" onClick={() => navigate('/store/checkout')}>
              Checkout <ArrowRight size={18} className="ml-2" />
            </Button>
            <p className="text-xs text-center text-slate-400 mt-4">Secure checkout. Prices are inclusive of all taxes.</p>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear Cart">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Are you sure?</h3>
          <p className="text-slate-500 mb-8">This will remove all {items.length} items from your cart. This action cannot be undone.</p>
          
          <div className="flex w-full gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowClearConfirm(false)} className="!rounded-xl">Cancel</Button>
            <Button variant="danger" fullWidth onClick={handleClearCart} className="!rounded-xl">Clear Cart</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
