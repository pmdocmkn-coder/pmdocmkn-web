import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { notificationApi } from '../services/notificationApi';
import { NotificationItem } from '../types/notification';
import { useAuth } from './AuthContext';
import { playNotificationSound } from '../utils/audioUtils';

interface SignalRContextValue {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextValue | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // ← listen ke perubahan user dari AuthContext
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connState, setConnState] = useState<{
    connection: signalR.HubConnection | null;
    isConnected: boolean;
  }>({ connection: null, isConnected: false });

  const connRef = useRef<signalR.HubConnection | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const [fetchedNotifications, count] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount()
      ]);
      setNotifications(fetchedNotifications);
      setUnreadCount(count);
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    // Hanya connect jika user sudah login (user object tidak null)
    // Ini fix masalah: saat pertama login, token belum ada saat useEffect jalan
    if (!user) {
      // User logout — cleanup koneksi lama jika ada
      if (connRef.current) {
        connRef.current.off('ReceiveNotification');
        connRef.current.off('RefreshData');
        connRef.current.stop();
        connRef.current = null;
        setConnState({ connection: null, isConnected: false });
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Kalau sudah ada koneksi aktif, tidak perlu buat ulang
    if (connRef.current && connRef.current.state === signalR.HubConnectionState.Connected) {
      return;
    }
    fetchInitialData();

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5116" || "https://api.mknops.web.id/swagger/index.html";

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${baseURL}/hubs/notification`, {
        accessTokenFactory: () => {
          const t = localStorage.getItem('authToken');
          return t || '';
        },
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connRef.current = conn;

    conn.on('ReceiveNotification', (notification: NotificationItem) => {
      playNotificationSound();
      setNotifications(prev => {
        // Jika notif dengan id sama sudah ada → update pesannya (bukan tambah baru)
        if (prev.some(n => n.id === notification.id)) {
          return prev.map(n => n.id === notification.id ? { ...notification } : n);
        }
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    conn.on('RefreshData', (entityName: string) => {
      console.log(`[SignalR] RefreshData received: ${entityName}`);
      // Handled by useLiveRefresh hooks in individual pages
    });

    const startConnection = async () => {
      try {
        await conn.start();
        setConnState({ connection: conn, isConnected: true });
      } catch (err) {
        setConnState({ connection: null, isConnected: false });
        setTimeout(() => startConnection(), 5000);
      }
    };

    startConnection();

    conn.onreconnecting((err) => {
      setConnState(prev => ({ ...prev, isConnected: false }));
    });

    conn.onreconnected((connId) => {
      // Buat object baru agar React mendeteksi perubahan dan useLiveRefresh re-register listener
      setConnState({ connection: conn, isConnected: true });
      fetchInitialData();
    });

    conn.onclose((err) => {
      setConnState({ connection: null, isConnected: false });
    });

    return () => {
      conn.off('ReceiveNotification');
      conn.off('RefreshData');
      conn.stop();
      connRef.current = null;
      setConnState({ connection: null, isConnected: false });
    };
  }, [user, fetchInitialData]); // ← re-run saat user berubah (login/logout)

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
    }
  };

  return (
    <SignalRContext.Provider value={{
      connection: connState.connection,
      isConnected: connState.isConnected,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refresh: fetchInitialData
    }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalRContext = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalRContext must be used within a SignalRProvider');
  }
  return context;
};
