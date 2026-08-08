import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Package, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Button size="sm" icon={Plus} onClick={() => navigate('/products/new')}>Add Product</Button>
      </div>
      <EmptyState icon={Package} title="No products yet" description="Add your first product to get started with inventory management." actionLabel="Add Product" onAction={() => navigate('/products/new')} />
    </div>
  );
}
