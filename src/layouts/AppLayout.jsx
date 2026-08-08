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

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
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
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile sidebar drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
        side="left"
      >
        <nav className="px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = LucideIcons[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                {Icon && <Icon size={20} />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <hr className="my-2 border-slate-100" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </Drawer>

      {/* "More" drawer for mobile bottom nav */}
      <Drawer
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
        title="More"
        side="right"
      >
        <nav className="px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = LucideIcons[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMoreDrawerOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                {Icon && <Icon size={20} />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <hr className="my-2 border-slate-100" />
          <button
            onClick={() => { setMoreDrawerOpen(false); handleLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </Drawer>

      {/* Top bar */}
      <TopBar
        onMenuClick={() => setMobileMenuOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main content */}
      <main className={`
        pt-16 pb-20 lg:pb-6 px-4 lg:px-6
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
      `}>
        <div className="max-w-7xl mx-auto py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setMoreDrawerOpen(true)} />
    </div>
  );
}
