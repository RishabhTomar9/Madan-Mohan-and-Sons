import EmptyState from '../components/ui/EmptyState';
import { ShoppingBag } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      <EmptyState icon={ShoppingBag} title="No orders yet" description="E-commerce orders will appear here." />
    </div>
  );
}
