import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/currency';
import { SHOP_INFO } from '../utils/constants';
import { Search, ShoppingBag, Plus, ArrowRight } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';
import Button from '../components/ui/Button';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        // Only show products enabled for online store and in stock
        setProducts(prodData.filter(p => p.showInStore !== false && p.stockQuantity > 0));
        setCategories(catData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <FullPageSpinner />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white pb-8">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12 sm:pt-12 sm:pb-20">
          <div className="flex items-center gap-4 mb-4">
            <img src="/applogo.png" alt={SHOP_INFO.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-white/30 shadow-lg" />
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">{SHOP_INFO.name}</h1>
              <p className="text-indigo-200 mt-1 text-sm sm:text-lg">{SHOP_INFO.tagline}</p>
            </div>
          </div>
          
          <div className="mt-8 relative max-w-xl">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 text-base focus:outline-none focus:ring-4 focus:ring-white/20 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              selectedCategory === '' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Products
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                selectedCategory === c.id 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
            <p className="text-slate-500 mt-1">Try searching for something else.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filtered.map(product => {
              const inCart = items.find(i => i.productId === product.id);
              
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col"
                >
                  <div 
                    className="aspect-square bg-slate-100 relative cursor-pointer"
                    onClick={() => navigate(`/store/products/${product.id}`)}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <div 
                      className="cursor-pointer mb-2 flex-1"
                      onClick={() => navigate(`/store/products/${product.id}`)}
                    >
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{product.unit}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        <p className="font-bold text-slate-900">{formatCurrency(product.price)}</p>
                        {product.mrp && product.mrp > product.price && (
                          <p className="text-[10px] sm:text-xs text-slate-400 line-through">{formatCurrency(product.mrp)}</p>
                        )}
                      </div>
                      
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1.5 rounded-lg text-indigo-700 font-bold text-sm">
                          <span>{inCart.quantity}</span>
                          <span className="text-[10px] uppercase tracking-wider">In Cart</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem({
                              productId: product.id,
                              name: product.name,
                              price: product.price,
                              imageUrl: product.imageUrl,
                            });
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0"
                          aria-label="Add to cart"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Floating View Cart Button (Mobile) */}
      {items.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 lg:hidden z-40">
          <Button 
            fullWidth 
            size="lg" 
            className="!rounded-2xl shadow-xl shadow-indigo-200 flex justify-between px-6"
            onClick={() => navigate('/store/cart')}
          >
            <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-2">View Cart <ArrowRight size={16} /></span>
          </Button>
        </div>
      )}
    </div>
  );
}
