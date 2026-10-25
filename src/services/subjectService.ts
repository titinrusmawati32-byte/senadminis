import { Subject } from '../types';
import { apiClient } from './apiClient';
import { memoryCache } from './cacheService';

export const subjectService = {
  async getAll(): Promise<Subject[]> {
    const cached = memoryCache.get<Subject[]>('subjects:all');
    if (cached) return cached;

    try {
      let results: Subject[] = [];
      if (apiClient.isConfigured()) {
        results = await apiClient.get<Subject[]>('getAll', { table: 'subjects' });
      }
      results = (results || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      memoryCache.set('subjects:all', results);
      return results;
    } catch (err) {
      console.warn('Gagal memuat mata pelajaran dari server:', err);
      return [];
    }
  },

  async create(data: Omit<Subject, 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = data.subjectId || `MAPEL-${Date.now()}`;
    const payload = {
      ...data,
      subjectId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'subjects',
        data: payload,
      });
    }

    memoryCache.invalidate('subjects');
    return id;
  },

  async update(subjectId: string, updates: Partial<Subject>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'subjects',
        id: subjectId,
        updates,
      });
    }
    memoryCache.invalidate('subjects');
  },

  async delete(subjectId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'subjects',
        id: subjectId,
      });
    }
    memoryCache.invalidate('subjects');
  },
};
