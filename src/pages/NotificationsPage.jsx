import EmptyState from '../components/ui/EmptyState';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      <EmptyState icon={Bell} title="All caught up!" description="You have no new notifications." />
    </div>
  );
}
