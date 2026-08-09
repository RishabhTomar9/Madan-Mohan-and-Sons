import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, getCategories, addCategory } from '../services/productService';
import { uploadImage } from '../services/cloudinaryService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // New Category State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    purchasePrice: '',
    mrp: '',
    stockQuantity: '',
    unit: 'pcs',
    barcode: '',
    description: '',
    imageUrl: '',
    showInStore: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);

        if (isEditing) {
          const prod = await getProduct(id);
          if (prod) {
            setFormData({
              name: prod.name || '',
              categoryId: prod.categoryId || '',
              price: prod.price || '',
              purchasePrice: prod.purchasePrice || '',
              mrp: prod.mrp || '',
              stockQuantity: prod.stockQuantity || '',
              unit: prod.unit || 'pcs',
              barcode: prod.barcode || '',
              description: prod.description || '',
              imageUrl: prod.imageUrl || '',
              showInStore: prod.showInStore ?? true,
            });
            if (prod.imageUrl) setImagePreview(prod.imageUrl);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const cat = await addCategory(newCatName.trim());
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, categoryId: cat.id }));
      setShowCatModal(false);
      setNewCatName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    setSaving(true);
    try {
      let finalImageUrl = formData.imageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        const uploadResult = await uploadImage(imageFile, 'products');
        finalImageUrl = uploadResult.url;
      }

      const productData = { ...formData, imageUrl: finalImageUrl };

      if (isEditing) {
        await updateProduct(id, productData);
      } else {
        await createProduct(productData);
      }
      
      navigate('/products');
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Product Image</h2>
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden bg-slate-50 shrink-0">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); setFormData(p => ({...p, imageUrl: ''})); }}
                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-slate-700 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-slate-400 text-center">
                  <Upload size={24} className="mx-auto mb-1 opacity-50" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload image"
              />
            </div>
            <div className="text-sm text-slate-500 max-w-sm">
              <p>Upload a high-quality product image. Images will be optimized and securely stored.</p>
              <p className="mt-2 text-xs">Recommended size: 800x800px (1:1 ratio). Max size: 5MB.</p>
            </div>
          </div>
        </div>

        {/* Basic Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 mb-2">Basic Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <Input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Premium Rice 5kg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <div className="flex gap-2">
              <select 
                name="categoryId" 
                value={formData.categoryId} 
                onChange={handleChange}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button type="button" variant="outline" icon={Plus} onClick={() => setShowCatModal(true)}>New</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Barcode (Optional)</label>
            <Input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Scan or type barcode" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              placeholder="Product details for the e-commerce store..."
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Pricing & Inventory</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹) *</label>
              <Input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
              <Input type="number" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price (₹)</label>
              <Input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder="0.00" />
            </div>
            
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Stock</label>
                <div className="flex gap-2">
                  <Input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} placeholder="0" className="flex-1" />
                  <select 
                    name="unit" 
                    value={formData.unit} 
                    onChange={handleChange}
                    className="w-24 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="g">g</option>
                    <option value="ltr">Ltr</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* E-commerce Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Show in Online Store</h2>
            <p className="text-sm text-slate-500 mt-1">If enabled, customers can see and order this product online.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name="showInStore" checked={formData.showInStore} onChange={handleChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" size="lg" loading={saving} className="min-w-[120px]">
            {isEditing ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </form>

      {/* New Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="New Category" size="sm">
        <div className="space-y-4">
          <Input 
            value={newCatName} 
            onChange={(e) => setNewCatName(e.target.value)} 
            placeholder="Category Name" 
            autoFocus 
          />
          <Button fullWidth onClick={handleAddCategory} loading={savingCat} disabled={!newCatName.trim()}>
            Save Category
          </Button>
        </div>
      </Modal>
    </div>
  );
}
