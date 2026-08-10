import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Drawer from '../components/ui/Drawer';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS } from '../utils/constants';
import { NavLink, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { LogOut } from 'lucide-react';
import SEO from '../components/SEO';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { userData, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV_ITEMS.staff.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 print:min-h-0 print:bg-white">
      <SEO title="Dashboard" />
      {/* Desktop sidebar */}
      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile bottom menu drawer */}
      <div className="print:hidden">
        <Drawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title="Menu"
          side="bottom"
        >
          <nav className="px-2 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = LucideIcons[item.icon];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
                    transition-colors duration-200
                    ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  {Icon && <Icon size={20} />}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <hr className="my-2 border-slate-100" />
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut size={20} className="text-red-500" />
              <span>Logout</span>
            </button>
          </nav>
        </Drawer>
      </div>

      {/* Top bar */}
      <div className="print:hidden">
        <TopBar
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>

      {/* Main content */}
      <main className={`
        pt-16 pb-20 lg:pb-6 px-4 lg:px-6
        print:pt-0 print:pb-0 print:px-0 print:m-0 print:!ml-0
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
      `}>
        <div className="max-w-7xl mx-auto py-6 print:max-w-none print:py-0 print:mx-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setMobileMenuOpen(true)} />
    </div>
  );
}
