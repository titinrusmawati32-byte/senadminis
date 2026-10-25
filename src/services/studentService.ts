import * as XLSX from 'xlsx';
import { Student, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { authorizationService, matchesClassAssignment } from './authorizationService';
import { memoryCache } from './cacheService';

export const INITIAL_SAMPLE_STUDENTS: Omit<Student, 'createdAt' | 'updatedAt'>[] = [
  // Kelas 1A
  { studentId: 'STU-1A-01', nis: '24101', nisn: '0165123401', name: 'Ahmad Fauzi Pratama', gender: 'L', classId: 'CLS-1A', className: 'Kelas 1A', status: 'active', qrCode: 'STU-1A-01' },
  { studentId: 'STU-1A-02', nis: '24102', nisn: '0165123402', name: 'Aisyah Putri Azzahra', gender: 'P', classId: 'CLS-1A', className: 'Kelas 1A', status: 'active', qrCode: 'STU-1A-02' },
  { studentId: 'STU-1A-03', nis: '24103', nisn: '0165123403', name: 'Bima Satria Yudha', gender: 'L', classId: 'CLS-1A', className: 'Kelas 1A', status: 'active', qrCode: 'STU-1A-03' },
  { studentId: 'STU-1A-04', nis: '24104', nisn: '0165123404', name: 'Cantika Dewi Maharani', gender: 'P', classId: 'CLS-1A', className: 'Kelas 1A', status: 'active', qrCode: 'STU-1A-04' },
  { studentId: 'STU-1A-05', nis: '24105', nisn: '0165123405', name: 'Danendra Raditya', gender: 'L', classId: 'CLS-1A', className: 'Kelas 1A', status: 'active', qrCode: 'STU-1A-05' },

  // Kelas 2A
  { studentId: 'STU-2A-01', nis: '23101', nisn: '0155123401', name: 'Dimas Anggara Saputra', gender: 'L', classId: 'CLS-2A', className: 'Kelas 2A', status: 'active', qrCode: 'STU-2A-01' },
  { studentId: 'STU-2A-02', nis: '23102', nisn: '0155123402', name: 'Eka Lestari Ningsih', gender: 'P', classId: 'CLS-2A', className: 'Kelas 2A', status: 'active', qrCode: 'STU-2A-02' },
  { studentId: 'STU-2A-03', nis: '23103', nisn: '0155123403', name: 'Fajar Maulana Ramadhan', gender: 'L', classId: 'CLS-2A', className: 'Kelas 2A', status: 'active', qrCode: 'STU-2A-03' },
  { studentId: 'STU-2A-04', nis: '23104', nisn: '0155123404', name: 'Gita Savitri Kirana', gender: 'P', classId: 'CLS-2A', className: 'Kelas 2A', status: 'active', qrCode: 'STU-2A-04' },
  { studentId: 'STU-2A-05', nis: '23105', nisn: '0155123405', name: 'Hafiz Al-Farisi', gender: 'L', classId: 'CLS-2A', className: 'Kelas 2A', status: 'active', qrCode: 'STU-2A-05' },
];

export const studentService = {
  async seedSampleStudents(): Promise<void> {
    try {
      for (const s of INITIAL_SAMPLE_STUDENTS) {
        await this.create(s);
      }
      memoryCache.invalidate('students');
    } catch (e) {
      console.warn('Seed students notice:', e);
    }
  },

  async getAll(currentUser?: UserProfile | null): Promise<Student[]> {
    const cached = memoryCache.get<Student[]>('students:all');
    let allStudents: Student[] = cached || [];

    if (!cached) {
      try {
        if (apiClient.isConfigured()) {
          allStudents = await apiClient.get<Student[]>('getAll', { table: 'students' });
        } else {
          allStudents = [];
        }
        allStudents = allStudents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        memoryCache.set('students:all', allStudents);
      } catch (err) {
        console.warn('Gagal memuat siswa dari server:', err);
        return [];
      }
    }

    // Role-based security filter: Guru ONLY receives students belonging to their assigned rombel
    if (currentUser && currentUser.role === 'guru') {
      const authorizedKeys = authorizationService.getUserAuthorizedClassKeys(currentUser);
      if (authorizedKeys.length === 0) return [];
      return allStudents.filter((s) => {
        return (
          matchesClassAssignment(s.classId, authorizedKeys) ||
          matchesClassAssignment(s.className || '', authorizedKeys)
        );
      });
    }

    return allStudents;
  },

  async getByClassId(classId: string, currentUser?: UserProfile | null): Promise<Student[]> {
    if (currentUser && currentUser.role === 'guru') {
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        classId,
        'melihat data siswa rombel ini'
      );
    }

    const all = await this.getAll(currentUser);
    return all.filter((s) => (s.classId === classId || s.className === classId) && s.status === 'active');
  },

  async getById(studentId: string): Promise<Student | null> {
    const all = await this.getAll();
    const found = all.find((s) => s.studentId === studentId);
    return found || null;
  },

  async create(
    student: Omit<Student, 'createdAt' | 'updatedAt'>,
    currentUser?: UserProfile | null
  ): Promise<string> {
    if (currentUser && currentUser.role === 'guru') {
      await authorizationService.assertTeacherAuthorizedForClass(
        currentUser,
        student.classId,
        'menambahkan siswa ke rombel ini'
      );
    }

    const id = student.studentId || `SISWA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrCode = student.qrCode || `STU-${id}`;
    const payload = {
      ...student,
      studentId: id,
      qrCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'students',
        data: payload,
      });
    }

    memoryCache.invalidate('students');
    return id;
  },

  async update(studentId: string, updates: Partial<Student>): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'students',
        id: studentId,
        updates,
      });
    }
    memoryCache.invalidate('students');
  },

  async delete(studentId: string, hardDelete = true): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'students',
        id: studentId,
        hardDelete,
      });
    }
    memoryCache.invalidate('students');
    memoryCache.invalidate('students:all');
  },

  async importFromExcel(file: File, defaultClassId: string, defaultClassName?: string): Promise<{ success: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);

          let count = 0;
          const errors: string[] = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row['Nama'] || row['Nama Siswa'] || row['name'] || row['Name'];
            const nis = String(row['NIS'] || row['nis'] || '').trim();
            const nisn = String(row['NISN'] || row['nisn'] || '').trim();
            const genderRaw = String(row['Jenis Kelamin'] || row['JK'] || row['gender'] || 'L').toUpperCase();
            const gender = genderRaw.startsWith('P') ? 'P' : 'L';
            const classId = row['ID Kelas'] || row['classId'] || defaultClassId;
            const className = row['Kelas'] || row['className'] || defaultClassName || '';

            if (!name) {
              errors.push(`Baris ${i + 2}: Nama siswa wajib diisi.`);
              continue;
            }

            const studentId = `SISWA-${Date.now()}-${i}`;
            await this.create({
              studentId,
              nis: nis || `${24000 + i}`,
              nisn: nisn || `${3000000000 + i}`,
              name,
              gender,
              classId,
              className,
              status: 'active',
              qrCode: `STU-${studentId}`,
            });
            count++;
          }
          resolve({ success: count, errors });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  exportToExcel(students: Student[], fileName = 'Data_Siswa'): void {
    const exportData = students.map((s, index) => ({
      No: index + 1,
      'NIS': s.nis,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Kelas': s.className || s.classId,
      'Status': s.status === 'active' ? 'Aktif' : 'Non-Aktif',
      'QR Code ID': s.qrCode || `STU-${s.studentId}`,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },
};
