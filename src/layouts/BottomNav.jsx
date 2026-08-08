import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MOBILE_NAV_STAFF, MOBILE_NAV_CUSTOMER } from '../utils/constants';
import * as LucideIcons from 'lucide-react';

export default function BottomNav({ onMoreClick }) {
  const { isStaff } = useAuth();
  const navItems = isStaff() ? MOBILE_NAV_STAFF : MOBILE_NAV_CUSTOMER;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 lg:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = LucideIcons[item.icon];

          if (item.path === null) {
            // "More" button — opens drawer
            return (
              <button
                key="more"
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-slate-500"
              >
                {Icon && <Icon size={22} />}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-0.5 px-3 py-1.5
                transition-colors duration-150
                ${isActive ? 'text-indigo-600' : 'text-slate-500'}
              `}
            >
              {Icon && <Icon size={22} />}
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
