import { AuditLog } from '../types';
import { apiClient } from './apiClient';
import { authService } from './authService';

export const auditService = {
  async log(action: string, collectionName: string, documentId: string, details?: string) {
    try {
      const user = authService.getCurrentLocalSession();
      const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (apiClient.isConfigured()) {
        await apiClient.post({
          action: 'create',
          table: 'audit_logs',
          data: {
            logId,
            userId: user?.uid || 'system',
            userName: user?.displayName || user?.username || 'System',
            action,
            collection: collectionName,
            documentId,
            timestamp: new Date().toISOString(),
            details: details || '',
          },
        });
      }
    } catch (e) {
      console.warn('Failed to record audit log', e);
    }
  },

  async getRecent(limitCount = 20): Promise<AuditLog[]> {
    if (!apiClient.isConfigured()) return [];

    try {
      const logs = await apiClient.get<AuditLog[]>('getAll', { table: 'audit_logs' });
      return (logs || [])
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, limitCount);
    } catch {
      return [];
    }
  },
};
