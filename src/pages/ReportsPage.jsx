import EmptyState from '../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <EmptyState icon={BarChart3} title="No reports yet" description="Sales, payment, khata, and inventory reports will appear here as you generate bills." />
    </div>
  );
}
