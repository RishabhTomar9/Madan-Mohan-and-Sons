import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllAsRead } from '../services/notificationService';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

function formatDistanceToNow(date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(user.uid);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
      case 'error': return <XCircle className="text-red-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          Notifications
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={Check}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up!" description="You have no notifications." />
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-2xl border transition-all flex gap-4 ${
                notification.isRead 
                  ? 'bg-white border-slate-100 opacity-75' 
                  : 'bg-indigo-50/30 border-indigo-100 shadow-sm'
              }`}
            >
              <div className="shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <h3 className={`font-medium ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                    {notification.title}
                  </h3>
                  {notification.createdAt && (
                    <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(notification.createdAt.toDate())}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
              </div>
              {!notification.isRead && (
                <button 
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="shrink-0 w-8 h-8 rounded-full hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors"
                  title="Mark as read"
                >
                  <Check size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
