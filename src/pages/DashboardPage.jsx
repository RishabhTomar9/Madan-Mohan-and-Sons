import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import {
  IndianRupee, Receipt, BookOpen, ShoppingBag,
  Package, AlertTriangle, TrendingUp, Clock, Users,
  LayoutDashboard,
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function DashboardPage() {
  const { userData } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back, {userData?.displayName?.split(' ')[0] || 'User'}
        </p>
      </div>

      {/* Sales Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Sales Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(0)}
            subtitle="0 transactions"
            icon={IndianRupee}
            color="emerald"
          />
          <StatCard
            title="This Week"
            value={formatCurrency(0)}
            subtitle="Mon - Sun"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(0)}
            subtitle={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      </section>

      {/* Billing Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Billing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Bills Today"
            value="0"
            icon={Receipt}
            color="indigo"
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(0)}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Cancelled Bills"
            value="0"
            icon={Receipt}
            color="red"
          />
        </div>
      </section>

      {/* KhataBook Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">KhataBook</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Receivable"
            value={formatCurrency(0)}
            icon={BookOpen}
            color="emerald"
          />
          <StatCard
            title="Total Payable"
            value={formatCurrency(0)}
            icon={BookOpen}
            color="red"
          />
          <StatCard
            title="Overdue Amount"
            value={formatCurrency(0)}
            icon={AlertTriangle}
            color="amber"
          />
        </div>
      </section>

      {/* E-commerce Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">E-commerce</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Orders Today"
            value="0"
            icon={ShoppingBag}
            color="indigo"
          />
          <StatCard
            title="Pending Orders"
            value="0"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Completed Orders"
            value="0"
            icon={ShoppingBag}
            color="emerald"
          />
        </div>
      </section>

      {/* Inventory Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Inventory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Products"
            value="0"
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Low Stock"
            value="0"
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="Out of Stock"
            value="0"
            icon={Package}
            color="red"
          />
        </div>
      </section>
    </div>
  );
}
