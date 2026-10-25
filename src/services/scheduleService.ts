import { Schedule } from '../types';
import { apiClient } from './apiClient';
import { memoryCache } from './cacheService';

function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && start2 < end1;
}

export const scheduleService = {
  async getAll(): Promise<Schedule[]> {
    const cached = memoryCache.get<Schedule[]>('schedules:all');
    if (cached) return cached;

    try {
      let results: Schedule[] = [];
      if (apiClient.isConfigured()) {
        results = await apiClient.get<Schedule[]>('getAll', { table: 'schedules' });
      }
      results = results.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      memoryCache.set('schedules:all', results);
      return results;
    } catch (err) {
      console.warn('Gagal memuat jadwal dari server:', err);
      return [];
    }
  },

  async create(data: Omit<Schedule, 'createdAt' | 'updatedAt'>): Promise<string> {
    const allSchedules = await this.getAll();
    const conflict = allSchedules.find(
      (s) =>
        s.status === 'active' &&
        s.day === data.day &&
        (s.teacherId === data.teacherId || s.classId === data.classId) &&
        isTimeOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
    );

    if (conflict) {
      if (conflict.teacherId === data.teacherId) {
        throw new Error(
          `Jadwal bentrok! Guru sudah memiliki jadwal mengajar di kelas ${conflict.className} pada ${data.day} pukul ${conflict.startTime} - ${conflict.endTime}`
        );
      } else {
        throw new Error(
          `Jadwal bentrok! Kelas ${conflict.className} sudah memiliki jadwal mapel ${conflict.subjectName} pada ${data.day} pukul ${conflict.startTime} - ${conflict.endTime}`
        );
      }
    }

    const id = data.scheduleId || `JADWAL-${Date.now()}`;
    const payload = {
      ...data,
      scheduleId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'schedules',
        data: payload,
      });
    }

    memoryCache.invalidate('schedules');
    return id;
  },

  async update(scheduleId: string, updates: Partial<Schedule>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'schedules',
        id: scheduleId,
        updates,
      });
    }
    memoryCache.invalidate('schedules');
  },

  async delete(scheduleId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'schedules',
        id: scheduleId,
      });
    }
    memoryCache.invalidate('schedules');
  },
};
