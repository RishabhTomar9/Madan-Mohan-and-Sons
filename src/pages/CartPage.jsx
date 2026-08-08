import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse our store to find products you love."
          actionLabel="Continue Shopping"
          onAction={() => navigate('/store')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Cart</h1>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{item.name}</p>
              <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"><Minus size={14} /></button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"><Plus size={14} /></button>
            </div>
            <p className="font-bold text-slate-900 w-20 text-right">{formatCurrency(item.price * item.quantity)}</p>
            <button onClick={() => removeItem(item.productId)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <span className="font-semibold text-slate-900">Total</span>
        <span className="text-xl font-bold text-slate-900">{formatCurrency(getTotal())}</span>
      </div>

      <Button fullWidth size="lg" onClick={() => navigate('/store/checkout')}>Proceed to Checkout</Button>
    </div>
  );
}
