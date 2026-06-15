import { api } from './api';
import { NotificationItem, NotificationUnreadCount } from '../types/notification';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE_URL = '/api/notification';

export const notificationApi = {
  getNotifications: async (unreadOnly = false, take = 20): Promise<NotificationItem[]> => {
    const res = await api.get<ApiResponse<NotificationItem[]>>(`${BASE_URL}`, {
      params: { unreadOnly, take }
    });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<NotificationUnreadCount>>(`${BASE_URL}/unread-count`);
    return res.data.data.count;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post(`${BASE_URL}/read-all`);
  }
};
