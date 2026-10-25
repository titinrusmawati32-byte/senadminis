import { Assessment, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { memoryCache } from './cacheService';

export const assessmentService = {
  async getAll(currentUser?: UserProfile | null): Promise<Assessment[]> {
    const cached = memoryCache.get<Assessment[]>('assessments:all');
    let results: Assessment[] = cached || [];

    if (!cached) {
      try {
        if (apiClient.isConfigured()) {
          results = await apiClient.get<Assessment[]>('getAll', { table: 'assessments' });
        } else {
          results = [];
        }
        results = (results || []).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        memoryCache.set('assessments:all', results);
      } catch (err) {
        console.warn('Gagal memuat asesmen dari server:', err);
        return [];
      }
    }

    if (currentUser && currentUser.role === 'guru') {
      const { authorizationService, matchesClassAssignment } = await import('./authorizationService');
      const authorizedKeys = authorizationService.getUserAuthorizedClassKeys(currentUser);
      if (authorizedKeys.length === 0) return [];
      return results.filter((a) => {
        return (
          matchesClassAssignment(a.classId, authorizedKeys) ||
          matchesClassAssignment(a.className || '', authorizedKeys)
        );
      });
    }

    return results;
  },

  async getByClassAndSubject(
    classId: string,
    subjectId?: string,
    currentUser?: UserProfile | null
  ): Promise<Assessment[]> {
    if (currentUser && currentUser.role === 'guru') {
      const { authorizationService } = await import('./authorizationService');
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        classId,
        'melihat data penilaian rombel ini'
      );
    }

    const all = await this.getAll(currentUser);
    const byClass = all.filter((a) => a.classId === classId || a.className === classId);
    return subjectId ? byClass.filter((a) => a.subjectId === subjectId) : byClass;
  },

  async create(
    data: Omit<Assessment, 'createdAt' | 'updatedAt'>,
    currentUser?: UserProfile | null
  ): Promise<string> {
    if (currentUser && currentUser.role === 'guru') {
      const { authorizationService } = await import('./authorizationService');
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        data.classId,
        'membuat asesmen nilai pada rombel ini'
      );
    }

    const id = data.assessmentId || `NILAI-${Date.now()}`;
    const payload = {
      ...data,
      assessmentId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'assessments',
        data: payload,
      });
    }

    memoryCache.invalidate('assessments');
    return id;
  },

  async update(assessmentId: string, updates: Partial<Assessment>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'assessments',
        id: assessmentId,
        updates,
      });
    }
    memoryCache.invalidate('assessments');
  },

  async delete(assessmentId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'assessments',
        id: assessmentId,
      });
    }
    memoryCache.invalidate('assessments');
  },

  calculateStats(scores: { score: number }[], kkm = 75, maxScore = 100) {
    if (!scores || scores.length === 0) {
      return { average: 0, highest: 0, lowest: 0, total: 0, passedCount: 0, passPercentage: 0 };
    }
    const validScores = scores.filter((s) => typeof s.score === 'number' && !isNaN(s.score));
    if (validScores.length === 0) {
      return { average: 0, highest: 0, lowest: 0, total: 0, passedCount: 0, passPercentage: 0 };
    }

    const total = validScores.length;
    const sum = validScores.reduce((acc, curr) => acc + curr.score, 0);
    const average = Math.round((sum / total) * 10) / 10;
    const highest = Math.max(...validScores.map((s) => s.score));
    const lowest = Math.min(...validScores.map((s) => s.score));
    const passedCount = validScores.filter((s) => s.score >= kkm).length;
    const passPercentage = Math.round((passedCount / total) * 100);

    return { average, highest, lowest, total, passedCount, passPercentage };
  },
};
