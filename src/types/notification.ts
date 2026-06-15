export interface NotificationItem {
  id: number;
  recipientUserId?: number | null;
  recipientRoleName?: string | null;
  title: string;
  message: string;
  category?: string | null;
  linkUrl?: string | null;
  referenceId?: number | null;
  referenceType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationUnreadCount {
  count: number;
}
