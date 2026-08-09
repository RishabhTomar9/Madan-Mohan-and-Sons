import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getProducts } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/currency';
import { ArrowLeft, ShoppingBag, Plus, Minus } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FullPageSpinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function StoreProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items, updateQuantity, removeItem } = useCart();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const prod = await getProduct(id);
        if (prod) {
          setProduct(prod);
          // Fetch similar products in same category
          if (prod.categoryId) {
            const all = await getProducts();
            const similar = all.filter(p => 
              p.categoryId === prod.categoryId && 
              p.id !== prod.id && 
              p.showInStore !== false && 
              p.stockQuantity > 0
            ).slice(0, 4); // limit to 4
            setSimilarProducts(similar);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  if (loading) return <FullPageSpinner />;

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h2>
        <Button onClick={() => navigate('/store')}>Back to Store</Button>
      </div>
    );
  }

  const inCart = items.find(i => i.productId === product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    toast.success('Added to cart!');
  };

  const handleUpdateQty = (newQty) => {
    if (newQty < 1) {
      removeItem(product.id);
      toast('Removed from cart', { icon: '🗑️' });
    } else {
      updateQuantity(product.id, newQty);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="relative">
            <button onClick={() => navigate('/store/cart')} className="p-2 text-slate-600 hover:text-slate-900">
              <ShoppingBag size={24} />
              {items.length > 0 && (
                <span className="absolute top-1 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {/* Main Product Info */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 aspect-square bg-slate-100 relative">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <ShoppingBag size={64} />
              </div>
            )}
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
            <Badge variant="default" className="w-fit mb-3">{product.categoryName || 'Uncategorized'}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">{product.name}</h1>
            <p className="text-sm text-slate-500 mb-6">Unit: {product.unit}</p>
            
            <div className="mb-8">
              <span className="text-3xl font-extrabold text-slate-900 mr-3">{formatCurrency(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-lg text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
              )}
              {product.mrp && product.mrp > product.price && (
                <div className="inline-block ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Save {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
                </div>
              )}
            </div>

            {product.description && (
              <div className="mb-8">
                <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-slate-100">
              {inCart ? (
                <div className="flex items-center justify-between bg-indigo-50 p-2 rounded-2xl border border-indigo-100">
                  <button 
                    onClick={() => handleUpdateQty(inCart.quantity - 1)}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-bold text-indigo-900 w-16 text-center">{inCart.quantity}</span>
                  <button 
                    onClick={() => handleUpdateQty(inCart.quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ) : (
                <Button fullWidth size="lg" onClick={handleAddToCart} className="!py-4 text-lg !rounded-2xl shadow-xl shadow-indigo-200">
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="pt-8 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map(sim => (
                <div key={sim.id} onClick={() => navigate(`/store/products/${sim.id}`)} className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
                  <div className="aspect-square bg-slate-100 relative">
                    {sim.imageUrl ? (
                      <img src={sim.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300"><ShoppingBag /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-slate-900 text-sm line-clamp-2">{sim.name}</p>
                    <p className="font-bold text-slate-900 mt-1">{formatCurrency(sim.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
