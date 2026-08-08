import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/productService';
import { formatCurrency } from '../utils/currency';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Package, Plus, Filter, Image as ImageIcon } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(prodData);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Button size="sm" icon={Plus} onClick={() => navigate('/products/new')}>Add Product</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title="No products found" 
          description={products.length === 0 ? "Add your first product to get started." : "Try adjusting your search or filters."}
          actionLabel={products.length === 0 ? "Add Product" : null}
          onAction={() => navigate('/products/new')} 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div 
              key={product.id} 
              onClick={() => navigate(`/products/${product.id}/edit`)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Product Image */}
              <div className="aspect-video bg-slate-100 relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={product.stockQuantity <= 5 ? 'danger' : 'success'}>
                    {product.stockQuantity} in stock
                  </Badge>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4 space-y-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <p className="font-bold text-slate-900">{formatCurrency(product.price)}</p>
                  {product.mrp && product.mrp > product.price && (
                    <p className="text-xs text-slate-400 line-through">{formatCurrency(product.mrp)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
