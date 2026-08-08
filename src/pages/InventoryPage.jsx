import EmptyState from '../components/ui/EmptyState';
import { Warehouse } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
      <EmptyState icon={Warehouse} title="No inventory data" description="Stock movements will appear here when you start adding products." />
    </div>
  );
}
