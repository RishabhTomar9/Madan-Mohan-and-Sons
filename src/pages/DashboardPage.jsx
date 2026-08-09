import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import { FullPageSpinner } from '../components/ui/Spinner';
import {
  IndianRupee, Receipt, BookOpen, AlertTriangle, 
  TrendingUp, PlusCircle, PackagePlus, UserPlus
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { getDashboardStats } from '../services/dashboardService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {userData?.displayName?.split(' ')[0] || 'User'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Receipt size={16} /> New Bill
          </button>
          <button 
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
          >
            <PackagePlus size={16} /> Add Product
          </button>
          <button 
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
          >
            <UserPlus size={16} /> Khata Customer
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.sales.today)}
          subtitle={`${stats.sales.todayCount} transactions`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Total Receivable (Khata)"
          value={formatCurrency(stats.khata.receivable)}
          subtitle="Pending collection"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Pending Bill Payments"
          value={formatCurrency(stats.billing.pendingAmount)}
          subtitle="Unpaid invoices"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.inventory.lowStock.toString()}
          subtitle={`${stats.inventory.outOfStock} out of stock`}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Revenue Chart */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Revenue Trend (Last 7 Days)</h2>
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {formatCurrency(stats.sales.week)} this week
          </span>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `₹${value}`}
                width={80}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#4f46e5" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
