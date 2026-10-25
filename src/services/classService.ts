import { SchoolClass, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { memoryCache } from './cacheService';

export const sortSDClasses = (a: SchoolClass, b: SchoolClass): number => {
  const gradeA = parseInt(a.grade || a.name.replace(/\D/g, ''), 10) || 0;
  const gradeB = parseInt(b.grade || b.name.replace(/\D/g, ''), 10) || 0;
  if (gradeA !== gradeB) return gradeA - gradeB;
  return a.name.localeCompare(b.name, undefined, { numeric: true });
};

export const groupClassesBySDGrade = (classes: SchoolClass[]): { grade: string; label: string; fase: string; classes: SchoolClass[] }[] => {
  const gradeMap: Record<string, SchoolClass[]> = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
  };

  classes.forEach((cls) => {
    const rawGrade = (cls.grade || cls.name.replace(/\D/g, '') || '1').trim();
    if (!gradeMap[rawGrade]) {
      gradeMap[rawGrade] = [];
    }
    gradeMap[rawGrade].push(cls);
  });

  const faseLabels: Record<string, string> = {
    '1': 'Fase A (Kelas 1 SD)',
    '2': 'Fase A (Kelas 2 SD)',
    '3': 'Fase B (Kelas 3 SD)',
    '4': 'Fase B (Kelas 4 SD)',
    '5': 'Fase C (Kelas 5 SD)',
    '6': 'Fase C (Kelas 6 SD)',
  };

  return ['1', '2', '3', '4', '5', '6'].map((g) => ({
    grade: g,
    label: `Tingkat Kelas ${g} SD`,
    fase: faseLabels[g] || `Kelas ${g}`,
    classes: (gradeMap[g] || []).sort(sortSDClasses),
  }));
};

export const DEFAULT_SD_CLASSES: Omit<SchoolClass, 'createdAt' | 'updatedAt'>[] = [
  { classId: 'CLS-1A', name: 'Kelas 1A', grade: '1', academicYear: '2024/2025' },
  { classId: 'CLS-1B', name: 'Kelas 1B', grade: '1', academicYear: '2024/2025' },
  { classId: 'CLS-2A', name: 'Kelas 2A', grade: '2', academicYear: '2024/2025' },
  { classId: 'CLS-2B', name: 'Kelas 2B', grade: '2', academicYear: '2024/2025' },
  { classId: 'CLS-3A', name: 'Kelas 3A', grade: '3', academicYear: '2024/2025' },
  { classId: 'CLS-3B', name: 'Kelas 3B', grade: '3', academicYear: '2024/2025' },
  { classId: 'CLS-4A', name: 'Kelas 4A', grade: '4', academicYear: '2024/2025' },
  { classId: 'CLS-4B', name: 'Kelas 4B', grade: '4', academicYear: '2024/2025' },
  { classId: 'CLS-5A', name: 'Kelas 5A', grade: '5', academicYear: '2024/2025' },
  { classId: 'CLS-5B', name: 'Kelas 5B', grade: '5', academicYear: '2024/2025' },
  { classId: 'CLS-6A', name: 'Kelas 6A', grade: '6', academicYear: '2024/2025' },
  { classId: 'CLS-6B', name: 'Kelas 6B', grade: '6', academicYear: '2024/2025' },
];

export const classService = {
  async getAll(): Promise<SchoolClass[]> {
    const cached = memoryCache.get<SchoolClass[]>('classes:all');
    if (cached) return cached;

    try {
      let results: SchoolClass[] = [];
      if (apiClient.isConfigured()) {
        results = await apiClient.get<SchoolClass[]>('getAll', { table: 'classes' });
      }

      if (results.length === 0) {
        results = DEFAULT_SD_CLASSES.map((c) => ({
          ...c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      const sorted = results.sort(sortSDClasses);
      memoryCache.set('classes:all', sorted);
      return sorted;
    } catch (err) {
      console.warn('Gagal memuat kelas dari server:', err);
      return DEFAULT_SD_CLASSES.map((c) => ({
        ...c,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  },

  async seedSDClasses(): Promise<void> {
    if (!apiClient.isConfigured()) return;
    for (const cls of DEFAULT_SD_CLASSES) {
      await this.create(cls);
    }
    memoryCache.invalidate('classes');
  },

  async create(data: Omit<SchoolClass, 'createdAt' | 'updatedAt'>): Promise<void> {
    const id = data.classId || `CLS-${Date.now()}`;
    const payload = {
      ...data,
      classId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'classes',
        data: payload,
      });
    }
    memoryCache.invalidate('classes');
  },

  async update(classId: string, data: Partial<SchoolClass>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'classes',
        id: classId,
        updates: data,
      });
    }
    memoryCache.invalidate('classes');
  },

  async getAssignedClassesForUser(user: UserProfile | null | undefined): Promise<SchoolClass[]> {
    const allClasses = await this.getAll();
    if (!user) return [];
    if (user.role === 'admin') return allClasses;

    const { authorizationService } = await import('./authorizationService');
    return authorizationService.filterClassesForUser(allClasses, user);
  },

  async assignHomeroom(
    classId: string,
    newHomeroomTeacherUid: string,
    teacherDisplayName?: string
  ): Promise<void> {
    try {
      const allClasses = await this.getAll();
      const targetClass = allClasses.find((c) => c.classId === classId || c.name === classId);
      if (!targetClass) throw new Error('Rombel tidak ditemukan');

      const { authService } = await import('./authService');
      const allTeachers = await authService.getAllTeachers(true);

      // 1. Remove previous homeroom teacher of this class if different
      for (const t of allTeachers) {
        if (
          t.isHomeroom &&
          (t.homeroomClass === targetClass.name || t.homeroomClass === targetClass.classId) &&
          t.uid !== newHomeroomTeacherUid
        ) {
          await authService.updateUserProfile(t.uid, {
            isHomeroom: false,
            homeroomClass: '',
          });
        }
      }

      // 2. Assign new homeroom teacher
      if (newHomeroomTeacherUid) {
        const teacher = allTeachers.find((t) => t.uid === newHomeroomTeacherUid);
        if (teacher) {
          const currentAssigned = teacher.assignedClasses || [];
          const nextAssigned = currentAssigned.includes(targetClass.name)
            ? currentAssigned
            : [...currentAssigned, targetClass.name];

          await authService.updateUserProfile(newHomeroomTeacherUid, {
            isHomeroom: true,
            homeroomClass: targetClass.name,
            assignedClasses: nextAssigned,
          });
        }
      }

      // 3. Invalidate cache
      memoryCache.invalidate('classes');
    } catch (err: any) {
      console.error('Gagal mengatur wali kelas:', err);
      throw err;
    }
  },

  async delete(classId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'classes',
        id: classId,
      });
    }
    memoryCache.invalidate('classes');
  },
};
