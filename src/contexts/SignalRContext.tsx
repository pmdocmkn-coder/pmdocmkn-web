import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { notificationApi } from '../services/notificationApi';
import { NotificationItem } from '../types/notification';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return; // Only fetch if logged in
      const [fetchedNotifications, count] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount()
      ]);
      setNotifications(fetchedNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch initial notification data', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    fetchInitialData();

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5116";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseURL}/hubs/notification`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveNotification', (notification: NotificationItem) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        setIsConnected(true);
        console.log('SignalR connected globally');
      } catch (err) {
        console.error('SignalR connection error: ', err);
      }
    };

    startConnection();

    connection.onreconnected(() => {
      setIsConnected(true);
      fetchInitialData(); 
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    return () => {
      connection.off('ReceiveNotification');
      connection.stop();
      connectionRef.current = null;
    };
  }, [fetchInitialData]);

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
      connection: connectionRef.current,
      isConnected,
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
