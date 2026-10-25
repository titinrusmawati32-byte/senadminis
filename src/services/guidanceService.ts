import { Guidance, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { authorizationService, matchesClassAssignment } from './authorizationService';
import { memoryCache } from './cacheService';

export const guidanceService = {
  async getAll(currentUser?: UserProfile | null): Promise<Guidance[]> {
    const cached = memoryCache.get<Guidance[]>('guidance:all');
    let allGuidance = cached;

    if (!allGuidance) {
      try {
        if (apiClient.isConfigured()) {
          allGuidance = await apiClient.get<Guidance[]>('getAll', { table: 'guidance' });
        } else {
          allGuidance = [];
        }
        allGuidance = (allGuidance || []).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        memoryCache.set('guidance:all', allGuidance);
      } catch (err) {
        console.warn('Gagal memuat data bimbingan dari server:', err);
        return [];
      }
    }

    if (currentUser && currentUser.role === 'guru') {
      const authorizedKeys = authorizationService.getUserAuthorizedClassKeys(currentUser);
      if (authorizedKeys.length === 0) return [];
      return allGuidance.filter((item) => {
        return matchesClassAssignment(item.className || '', authorizedKeys);
      });
    }

    return allGuidance;
  },

  async create(
    data: Omit<Guidance, 'createdAt' | 'updatedAt'>,
    currentUser?: UserProfile | null
  ): Promise<string> {
    if (currentUser && currentUser.role === 'guru') {
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        data.className || '',
        'mencatat bimbingan siswa rombel ini'
      );
    }

    const id = data.guidanceId || `BIMBINGAN-${Date.now()}`;
    const payload = {
      ...data,
      guidanceId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'guidance',
        data: payload,
      });
    }

    memoryCache.invalidate('guidance');
    return id;
  },

  async update(guidanceId: string, updates: Partial<Guidance>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'guidance',
        id: guidanceId,
        updates,
      });
    }
    memoryCache.invalidate('guidance');
  },

  async delete(guidanceId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'guidance',
        id: guidanceId,
      });
    }
    memoryCache.invalidate('guidance');
  },
};
