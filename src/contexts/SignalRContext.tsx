import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { notificationApi } from '../services/notificationApi';
import { NotificationItem } from '../types/notification';
import { useAuth } from './AuthContext';

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
      console.error('[SignalR] Failed to fetch initial data', error);
    }
  }, []);

  useEffect(() => {
    // Hanya connect jika user sudah login (user object tidak null)
    // Ini fix masalah: saat pertama login, token belum ada saat useEffect jalan
    if (!user) {
      // User logout — cleanup koneksi lama jika ada
      if (connRef.current) {
        console.log('[SignalR] User logged out, stopping connection...');
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
      console.log('[SignalR] Already connected, skipping reconnect');
      return;
    }

    console.log('[SignalR] User logged in, starting connection for:', user.username);
    fetchInitialData();

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5116";

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
      console.log('[SignalR] ReceiveNotification:', notification.title);
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    conn.on('RefreshData', (entityName: string) => {
      console.log('[SignalR] RefreshData received at context level:', entityName);
    });

    const startConnection = async () => {
      try {
        console.log('[SignalR] Attempting to connect to:', `${baseURL}/hubs/notification`);
        await conn.start();
        setConnState({ connection: conn, isConnected: true });
        console.log('[SignalR] ✅ Connected! ConnectionId:', conn.connectionId);
      } catch (err) {
        console.error('[SignalR] ❌ Connection error:', err);
        setConnState({ connection: null, isConnected: false });
        setTimeout(() => startConnection(), 5000);
      }
    };

    startConnection();

    conn.onreconnecting((err) => {
      console.warn('[SignalR] Reconnecting...', err);
      setConnState(prev => ({ ...prev, isConnected: false }));
    });

    conn.onreconnected((connId) => {
      console.log('[SignalR] ✅ Reconnected! ConnectionId:', connId);
      setConnState({ connection: conn, isConnected: true });
      fetchInitialData();
    });

    conn.onclose((err) => {
      console.warn('[SignalR] Connection closed.', err);
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
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
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
