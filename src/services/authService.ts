import { UserProfile, UserRole } from '../types';
import { apiClient } from './apiClient';

const LOCAL_SESSION_KEY = 'admin_guru_session';

export const DEFAULT_ADMIN_USER: UserProfile = {
  uid: 'TCH-ADMIN-DEFAULT',
  username: 'admin',
  displayName: 'Administrator Sekolah',
  role: 'admin',
  nip: '198001012005011001',
  phone: '081234567000',
  email: 'admin@sekolah.sch.id',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type AuthStateCallback = (user: UserProfile | null) => void;
const authStateListeners: Set<AuthStateCallback> = new Set();

export const authService = {
  getCurrentLocalSession(): UserProfile | null {
    try {
      const data = localStorage.getItem(LOCAL_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async loginWithUsername(username: string, password: string): Promise<UserProfile> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Fallback Darurat: Jika Google Apps Script belum disetel atau offline,
    // Admin Master tetap dapat login untuk mengatur URL Google Apps Script di menu Pengaturan!
    const isMasterAdminLogin =
      cleanUser === 'admin' &&
      ['admin', 'admin123', 'admin2025', 'admin2026', '123456', 'password'].includes(cleanPass);

    if (!apiClient.isConfigured()) {
      if (isMasterAdminLogin) {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
        this.notifyListeners(DEFAULT_ADMIN_USER);
        return DEFAULT_ADMIN_USER;
      }
      throw new Error(
        'Database Google Apps Script belum terhubung. Silakan login sebagai "admin" untuk mengatur URL Google Apps Script di menu Pengaturan.'
      );
    }

    try {
      const res = await apiClient.post<{ profile: UserProfile }>({
        action: 'login',
        username: cleanUser,
        password: cleanPass,
      });

      if (!res.profile) {
        throw new Error('Respons profil pengguna tidak valid dari server.');
      }

      const profile = res.profile;
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
      this.notifyListeners(profile);
      return profile;
    } catch (err: any) {
      // Jika request server gagal tetapi merupakan master admin, izinkan fallback
      if (isMasterAdminLogin) {
        console.warn('Login offline master admin digunakan:', err.message);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
        this.notifyListeners(DEFAULT_ADMIN_USER);
        return DEFAULT_ADMIN_USER;
      }
      throw err;
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const local = this.getCurrentLocalSession();
    if (local && local.uid === uid) {
      return local;
    }

    if (!apiClient.isConfigured()) {
      return local;
    }

    try {
      const users = await apiClient.get<UserProfile[]>('getAll', { table: 'users' });
      const found = users.find((u) => u.uid === uid);
      return found || null;
    } catch (err) {
      console.warn('Gagal mengambil profil pengguna dari server:', err);
      return local;
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const current = this.getCurrentLocalSession();
    if (current && current.uid === uid) {
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
      this.notifyListeners(updated);
    }

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'users',
        id: uid,
        updates,
      });
    }
  },

  async getAllTeachers(includeInactive = true): Promise<UserProfile[]> {
    if (!apiClient.isConfigured()) {
      return [];
    }

    try {
      const users = await apiClient.get<UserProfile[]>('getAll', { table: 'users' });
      return users.filter((u) => {
        const isTeacher = u.role === 'guru';
        if (!includeInactive) return isTeacher && u.status === 'active';
        return isTeacher;
      });
    } catch (err) {
      console.warn('Gagal memuat daftar guru:', err);
      return [];
    }
  },

  async createTeacherAccount(data: {
    username: string;
    displayName: string;
    password?: string;
    nip?: string;
    phone?: string;
    email?: string;
    assignedClasses?: string[];
    assignedSubjects?: string[];
    isHomeroom?: boolean;
    homeroomClass?: string;
  }): Promise<UserProfile> {
    const cleanUser = data.username.trim().toLowerCase();
    const cleanPassword = data.password?.trim() || 'guru12345';
    const uid = `GURU-${cleanUser}-${Date.now().toString().slice(-4)}`;
    const teacherId = data.nip ? `NIP-${data.nip}` : `GURU-${Math.floor(100 + Math.random() * 900)}`;

    const newTeacher: UserProfile & { password?: string } = {
      uid,
      username: cleanUser,
      displayName: data.displayName.trim(),
      role: 'guru',
      password: cleanPassword,
      teacherId,
      nip: data.nip?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || `${cleanUser}@sekolah.sch.id`,
      assignedClasses: data.assignedClasses || [],
      assignedSubjects: data.assignedSubjects || [],
      isHomeroom: Boolean(data.isHomeroom),
      homeroomClass: data.homeroomClass || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'create',
        table: 'users',
        data: newTeacher,
      });
    }

    delete newTeacher.password;
    return newTeacher;
  },

  async deleteTeacher(uid: string): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'delete',
        table: 'users',
        id: uid,
        hardDelete: true,
      });
    }
  },

  async toggleTeacherStatus(uid: string, status: 'active' | 'inactive'): Promise<void> {
    if (apiClient.isConfigured()) {
      await apiClient.post({
        action: 'update',
        table: 'users',
        id: uid,
        updates: { status },
      });
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    this.notifyListeners(null);
  },

  onAuthState(callback: AuthStateCallback): () => void {
    authStateListeners.add(callback);
    // Langsung trigger status saat ini
    const current = this.getCurrentLocalSession();
    callback(current);

    return () => {
      authStateListeners.delete(callback);
    };
  },

  notifyListeners(user: UserProfile | null): void {
    for (const listener of authStateListeners) {
      try {
        listener(user);
      } catch (e) {
        console.warn('Listener error in authService:', e);
      }
    }
  },
};
