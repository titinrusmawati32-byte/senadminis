import { DatabaseBackup } from '../types';
import { apiClient } from './apiClient';
import { authService } from './authService';

export const backupService = {
  async exportFullDatabase(): Promise<DatabaseBackup> {
    const user = authService.getCurrentLocalSession();

    if (apiClient.isConfigured()) {
      try {
        const res = await apiClient.post<{ backup: DatabaseBackup }>({
          action: 'exportDatabase',
        });
        if (res.backup) {
          return res.backup;
        }
      } catch (e) {
        console.warn('Export via direct action failed, falling back to multi-table get:', e);
      }
    }

    // Fallback: Ambil data dari tiap tabel satu per satu
    const tables = [
      'users',
      'students',
      'classes',
      'subjects',
      'schedules',
      'attendance',
      'assessments',
      'teaching_agendas',
      'guidance',
    ];

    const data: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const tbl of tables) {
      try {
        const rows = await apiClient.get<any[]>('getAll', { table: tbl });
        data[tbl] = rows || [];
        totalRecords += (rows || []).length;
      } catch {
        data[tbl] = [];
      }
    }

    return {
      backupId: `BACKUP-GAS-${Date.now()}`,
      timestamp: new Date().toISOString(),
      createdBy: user?.displayName || user?.username || 'Administrator',
      totalRecords,
      data,
    };
  },

  downloadBackupJSON(backup: DatabaseBackup): void {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ADMIN_GURU_BACKUP_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async restoreDatabase(backupData: DatabaseBackup): Promise<{ success: number; errors: string[] }> {
    if (!apiClient.isConfigured()) {
      throw new Error('Google Apps Script belum terhubung.');
    }

    try {
      const res = await apiClient.post({
        action: 'restoreDatabase',
        backupData,
      });

      return {
        success: backupData.totalRecords || 0,
        errors: res.success ? [] : [res.error || 'Gagal memulihkan database'],
      };
    } catch (err: any) {
      return {
        success: 0,
        errors: [err.message || String(err)],
      };
    }
  },
};
