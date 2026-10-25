import { TeachingAgenda, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { authorizationService, matchesClassAssignment } from './authorizationService';
import { memoryCache } from './cacheService';

export const agendaService = {
  async getAll(currentUser?: UserProfile | null): Promise<TeachingAgenda[]> {
    const cached = memoryCache.get<TeachingAgenda[]>('agendas:all');
    let allAgendas = cached;

    if (!allAgendas) {
      try {
        if (apiClient.isConfigured()) {
          allAgendas = await apiClient.get<TeachingAgenda[]>('getAll', { table: 'teaching_agendas' });
        } else {
          allAgendas = [];
        }
        allAgendas = (allAgendas || []).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        memoryCache.set('agendas:all', allAgendas);
      } catch (err) {
        console.warn('Gagal memuat agenda mengajar dari server:', err);
        return [];
      }
    }

    if (currentUser && currentUser.role === 'guru') {
      const authorizedKeys = authorizationService.getUserAuthorizedClassKeys(currentUser);
      if (authorizedKeys.length === 0) return [];
      return allAgendas.filter((item) => {
        return (
          matchesClassAssignment(item.classId, authorizedKeys) ||
          matchesClassAssignment(item.className || '', authorizedKeys)
        );
      });
    }

    return allAgendas;
  },

  async create(
    data: Omit<TeachingAgenda, 'createdAt' | 'updatedAt'>,
    currentUser?: UserProfile | null
  ): Promise<string> {
    if (currentUser && currentUser.role === 'guru') {
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        data.classId,
        'membuat agenda mengajar di rombel ini'
      );
    }

    const id = data.agendaId || `AGENDA-${Date.now()}`;
    const payload = {
      ...data,
      agendaId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'teaching_agendas',
        data: payload,
      });
    }

    memoryCache.invalidate('agendas');
    return id;
  },

  async update(agendaId: string, updates: Partial<TeachingAgenda>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'teaching_agendas',
        id: agendaId,
        updates,
      });
    }
    memoryCache.invalidate('agendas');
  },

  async delete(agendaId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'teaching_agendas',
        id: agendaId,
      });
    }
    memoryCache.invalidate('agendas');
  },
};
