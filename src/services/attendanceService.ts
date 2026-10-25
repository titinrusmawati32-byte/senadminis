import { AttendanceRecord, AttendanceStatus, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { authorizationService, matchesClassAssignment } from './authorizationService';

export const attendanceService = {
  /**
   * Berlangganan data presensi untuk tanggal dan rombel tertentu.
   * Menggunakan polling berkala ringan (setiap 20 detik) untuk Google Apps Script.
   */
  subscribeByDateAndClass(
    date: string,
    classId: string,
    onUpdate: (records: AttendanceRecord[]) => void,
    subjectId?: string,
    currentUser?: UserProfile | null
  ): () => void {
    if (currentUser && currentUser.role === 'guru') {
      const authorizedKeys = authorizationService.getUserAuthorizedClassKeys(currentUser);
      if (!matchesClassAssignment(classId, authorizedKeys)) {
        console.warn(`[Akses Ditolak] Guru tidak memiliki wewenang presensi pada rombel: ${classId}`);
        onUpdate([]);
        return () => {};
      }
    }

    let isSubscribed = true;

    const fetchCurrent = async () => {
      if (!isSubscribed) return;
      try {
        const list = await this.getByDateAndClass(date, classId, subjectId, currentUser);
        if (isSubscribed) {
          onUpdate(list);
        }
      } catch (err) {
        console.warn('Gagal memperbarui presensi realtime:', err);
      }
    };

    // Jalankan segera sekali
    fetchCurrent();

    // Polling setiap 20 detik jika aktif
    const intervalId = setInterval(fetchCurrent, 20000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  },

  async getByDateAndClass(
    date: string,
    classId: string,
    subjectId?: string,
    currentUser?: UserProfile | null
  ): Promise<AttendanceRecord[]> {
    if (currentUser && currentUser.role === 'guru') {
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        classId,
        'melihat rekapan presensi rombel ini'
      );
    }

    if (!apiClient.isConfigured()) {
      return [];
    }

    try {
      const list = await apiClient.get<AttendanceRecord[]>('getAttendanceByDateAndClass', {
        date,
        classId,
        subjectId,
      });
      return list || [];
    } catch (err) {
      console.warn('Gagal memuat presensi:', err);
      return [];
    }
  },

  async getAll(currentUser?: UserProfile | null): Promise<AttendanceRecord[]> {
    if (!apiClient.isConfigured()) {
      return [];
    }

    try {
      let list = await apiClient.get<AttendanceRecord[]>('getAll', { table: 'attendance' });
      list = list || [];

      if (currentUser && currentUser.role === 'guru') {
        const authorizedKeys = authorizationService.getUserAuthorizedClassKeys(currentUser);
        if (authorizedKeys.length === 0) return [];
        return list.filter((rec) => {
          return (
            matchesClassAssignment(rec.classId, authorizedKeys) ||
            matchesClassAssignment(rec.className || '', authorizedKeys)
          );
        });
      }

      return list;
    } catch (err) {
      console.warn('Gagal memuat seluruh presensi:', err);
      return [];
    }
  },

  async saveBatch(
    records: Omit<AttendanceRecord, 'createdAt' | 'updatedAt'>[],
    currentUser?: UserProfile | null
  ): Promise<void> {
    if (currentUser && currentUser.role === 'guru') {
      for (const rec of records) {
        await authorizationService.assertTeacherAuthorizedForClass(
          currentUser,
          rec.classId,
          'menyimpan presensi rombel ini'
        );
      }
    }

    if (!apiClient.isConfigured()) return;

    await apiClient.post({
      action: 'saveAttendanceBatch',
      records,
    });
  },

  async recordScan(
    record: Omit<AttendanceRecord, 'attendanceId' | 'createdAt' | 'updatedAt'>,
    currentUser?: UserProfile | null
  ): Promise<string> {
    if (currentUser && currentUser.role === 'guru') {
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        record.classId,
        'melakukan scan presensi QR rombel ini'
      );
    }

    const docId = `${record.date}_${record.classId}_${record.studentId}_${record.subjectId || 'general'}`;
    const fullRecord = {
      ...record,
      attendanceId: docId,
      method: 'qr' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'saveAttendanceBatch',
        records: [fullRecord],
      });
    }

    return docId;
  },

  async updateSingle(attendanceId: string, status: AttendanceStatus, notes?: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'attendance',
        id: attendanceId,
        updates: {
          status,
          notes: notes || '',
        },
      });
    }
  },

  async delete(attendanceId: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'attendance',
        id: attendanceId,
      });
    }
  },
};
