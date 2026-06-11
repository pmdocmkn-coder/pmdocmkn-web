import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Check, Info, AlertTriangle, Wrench, Package, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../types/notification';

interface NotificationPanelProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const getCategoryIcon = (category?: string | null) => {
  switch (category) {
    case 'repair': return <Wrench className="w-5 h-5 text-blue-500" />;
    case 'handover': return <ArrowRight className="w-5 h-5 text-green-500" />;
    case 'scrap': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    default: return <Info className="w-5 h-5 text-gray-500" />;
  }
};

const getNavigateUrl = (n: NotificationItem): string | null => {
  if (n.linkUrl) return n.linkUrl;
  
  if (n.category === 'repair' && n.referenceId) {
    return `/radio-repair-dashboard`;
  }
  if (n.category === 'handover' && n.referenceId) {
    return `/radio-handover`; 
  }
  if (n.category === 'scrap' && n.referenceId) {
    return `/radio-scrap`;
  }
  return null;
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      onMarkAsRead(n.id);
    }
    const url = getNavigateUrl(n);
    if (url) {
      navigate(url);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifikasi</h3>
        {unreadCount > 0 && (
          <button 
            onClick={onMarkAllAsRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <Check className="w-4 h-4" /> Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Tidak ada notifikasi
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map(n => (
              <li 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  !n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z'), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
