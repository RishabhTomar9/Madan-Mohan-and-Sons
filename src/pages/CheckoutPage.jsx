import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to Cart
      </button>
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Checkout flow with delivery address, payment options, and order confirmation coming soon.
      </div>
    </div>
  );
}
