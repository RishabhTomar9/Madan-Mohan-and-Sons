import { SHOP_INFO } from '../utils/constants';
import { Store, Search, ShoppingBag } from 'lucide-react';

export default function StorePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <div className="flex items-center gap-4 mb-2">
            <img src="/applogo.png" alt={SHOP_INFO.name} className="w-14 h-14 rounded-xl object-cover border-2 border-white/30" />
            <h1 className="text-3xl sm:text-4xl font-bold">{SHOP_INFO.name}</h1>
          </div>
          <p className="text-indigo-200 mt-2 text-lg">Your one-stop shop for quality products</p>
          <div className="mt-6 relative max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700">Store Coming Soon</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Products will be listed here once the store owner adds them.
          </p>
        </div>
      </div>
    </div>
  );
}
