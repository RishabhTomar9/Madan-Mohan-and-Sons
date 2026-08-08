import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS, SHOP_INFO } from '../../utils/constants';
import { LogOut, ChevronLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function Sidebar({ collapsed, onToggle }) {
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
    <aside className={`
      fixed top-0 left-0 h-full bg-white border-r border-slate-200
      flex flex-col z-40 transition-all duration-300
      ${collapsed ? 'w-[72px]' : 'w-64'}
      hidden lg:flex
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          MM
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-sm truncate">{SHOP_INFO.name}</h1>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = LucideIcons[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon size={20} className="shrink-0" />}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-3">
        {!collapsed && userData && (
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
              {userData.displayName?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{userData.displayName}</p>
              <p className="text-xs text-slate-400 capitalize">{userData.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600
            hover:bg-red-50 hover:text-red-600 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
          title="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
