import { AppNotification } from '../types';
import { apiClient } from './apiClient';

export const notificationService = {
  subscribe(callback: (notifications: AppNotification[]) => void): () => void {
    let isSubscribed = true;

    const fetchNotifs = async () => {
      if (!isSubscribed || !apiClient.isConfigured()) return;
      try {
        const list = await apiClient.get<AppNotification[]>('getAll', { table: 'notifications' });
        if (isSubscribed) {
          const sorted = (list || [])
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            .slice(0, 15);
          callback(sorted);
        }
      } catch (err) {
        console.warn('Gagal memuat notifikasi:', err);
      }
    };

    fetchNotifs();
    const intervalId = setInterval(fetchNotifs, 20000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  },

  async send(notification: Omit<AppNotification, 'notificationId' | 'createdAt'>): Promise<void> {
    const id = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payload = {
      ...notification,
      notificationId: id,
      createdAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'notifications',
        data: payload,
      });
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'notifications',
        id: notificationId,
        updates: {
          read: true,
        },
      });
    }
  },
};
