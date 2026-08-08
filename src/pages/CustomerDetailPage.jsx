import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { User } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>
      <EmptyState icon={User} title="Customer details" description="Full customer profile with purchase history, invoices, and khata balance coming soon." />
    </div>
  );
}
