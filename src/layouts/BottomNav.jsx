import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MOBILE_NAV_STAFF, MOBILE_NAV_CUSTOMER } from '../utils/constants';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav({ onMoreClick }) {
  const { isStaff, hasPermission } = useAuth();
  let navItems = isStaff() ? MOBILE_NAV_STAFF : MOBILE_NAV_CUSTOMER;
  
  if (isStaff()) {
    navItems = navItems.filter(item => !item.permission || hasPermission(item.permission));
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200/50 z-30 lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = LucideIcons[item.icon];

          if (item.path === null) {
            return (
              <button
                key="more"
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center gap-1 p-2 w-16 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                {Icon && <Icon size={24} strokeWidth={2} />}
                <span className="text-[10px] font-semibold tracking-wide">More</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 p-2 w-16 relative
                transition-colors duration-200
                ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}
              `}
            >
              {({ isActive }) => (
                <>
                  {Icon && <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />}
                  <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-[1px] w-8 h-1 bg-indigo-600 rounded-b-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
