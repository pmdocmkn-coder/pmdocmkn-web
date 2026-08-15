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

export interface HelpdeskNotificationSetting {
  helpdeskEmailEnabled: boolean;
  helpdeskEmailRecipients: string[];
}

export const notificationSettingApi = {
  getHelpdeskSetting: async (): Promise<HelpdeskNotificationSetting> => {
    const res = await api.get<ApiResponse<HelpdeskNotificationSetting>>('/api/notification-settings/helpdesk');
    return res.data.data;
  },

  updateHelpdeskSetting: async (data: HelpdeskNotificationSetting): Promise<HelpdeskNotificationSetting> => {
    const res = await api.put<ApiResponse<HelpdeskNotificationSetting>>('/api/notification-settings/helpdesk', data);
    return res.data.data;
  },

  sendTestEmail: async (targetEmail: string): Promise<boolean> => {
    const res = await api.post<ApiResponse<{ sent: boolean }>>('/api/notification-settings/test-email', { targetEmail });
    return res.data.success;
  }
};
