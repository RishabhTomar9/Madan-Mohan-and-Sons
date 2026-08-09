import { useAuth } from '../contexts/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SHOP_INFO } from '../utils/constants';
import { useState, useEffect } from 'react';
import { getUnreadNotificationsCount } from '../services/notificationService';

export default function TopBar({ onMenuClick, sidebarCollapsed }) {
  const { user, userData } = useAuth();
  const { isOnline } = useOnlineStatus();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadNotificationsCount(user.uid)
        .then(setUnreadCount)
        .catch(console.error);
    }
  }, [user]);

  return (
    <header className={`
      fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-30
      flex items-center gap-4 px-4
      transition-all duration-300
      left-0
      ${sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'}
    `}>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <img
          src="/applogo.png"
          alt={SHOP_INFO.name}
          className="w-8 h-8 rounded-lg object-cover"
        />
        <span className="font-semibold text-slate-900 text-sm">{SHOP_INFO.name}</span>
      </div>

      {/* Online status */}
      <div className="hidden sm:flex items-center gap-1.5 ml-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <span className="text-xs text-slate-500">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {/* Profile */}
      {user && (
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2"
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-8 h-8 rounded-full border-2 border-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {user.displayName?.[0] || 'U'}
            </div>
          )}
        </button>
      )}
    </header>
  );
}
