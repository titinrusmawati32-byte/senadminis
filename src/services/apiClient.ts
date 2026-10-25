/**
 * API Client for Google Apps Script (GAS) & Google Sheets Backend
 * Mendukung akses multi-device (Desktop, Tablet, Ponsel) & sinkronisasi data realtime.
 * URL terproteksi dan disembunyikan dari antarmuka demi keamanan basis data sekolah.
 */

import { memoryCache } from './cacheService';

// 1. Prioritas Utama: URL diinjeksikan saat proses build melalui GitHub Secrets (VITE_GAS_API_URL)
const RAW_ENV_URL = ((import.meta as any).env?.VITE_GAS_API_URL || '').trim();

// 2. Fallback Storage untuk perangkat lokal / konfigurasi privat
const STORAGE_KEY_GAS_URL = 'admin_guru_gas_url';

// 3. Otomatis tangkap tautan konfigurasi satu-kali (jika dibuka dari tautan privat di HP)
if (typeof window !== 'undefined') {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const directUrl = urlParams.get('db_url') || urlParams.get('gas_url');
    if (directUrl && directUrl.startsWith('https://script.google.com/macros/s/')) {
      localStorage.setItem(STORAGE_KEY_GAS_URL, directUrl.trim());
      // Bersihkan parameter dari address bar demi privasi
      urlParams.delete('db_url');
      urlParams.delete('gas_url');
      const cleanSearch = urlParams.toString();
      const newUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  } catch (e) {
    // Abaikan jika env bukan browser standar
  }
}

export interface GasApiResponse<T = any> {
  success: boolean;
  data?: T;
  profile?: any;
  id?: string;
  count?: number;
  message?: string;
  error?: string;
  backup?: any;
}

export const apiClient = {
  /**
   * Mengambil URL Google Apps Script secara aman.
   * Diprioritaskan dari Environment Variable (GitHub Actions Secret / .env).
   */
  getGasUrl(): string {
    if (RAW_ENV_URL) {
      return RAW_ENV_URL;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GAS_URL);
      if (stored && stored.trim().startsWith('http')) {
        return stored.trim();
      }
    } catch {}
    return '';
  },

  /**
   * Mengecek apakah endpoint Google Apps Script telah terhubung.
   */
  isConfigured(): boolean {
    const url = this.getGasUrl();
    return Boolean(url && url.startsWith('http') && url.includes('/exec'));
  },

  /**
   * Melakukan request GET ke Google Apps Script secara REALTIME
   * Ditambahkan parameter timestamp (_t) & cache: 'no-store' agar selalu memperoleh
   * data mutakhir dari Google Sheets tanpa terkena browser cache di berbagai device.
   */
  async get<T = any>(action: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    const baseUrl = this.getGasUrl();
    if (!baseUrl) {
      throw new Error(
        'Database belum terhubung. Konfigurasikan secret "VITE_GAS_API_URL" pada GitHub Repository Settings > Secrets and variables > Actions.'
      );
    }

    const urlObj = new URL(baseUrl);
    urlObj.searchParams.set('action', action);
    // Anti-cache timestamp untuk kepastian data realtime
    urlObj.searchParams.set('_t', String(Date.now()));

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        urlObj.searchParams.set(k, String(v));
      }
    }

    try {
      const res = await fetch(urlObj.toString(), {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store', // Mencegah caching browser di HP maupun Desktop
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const json: GasApiResponse<T> = await res.json();
      if (!json.success) {
        throw new Error(json.error || `Aksi "${action}" gagal diproses.`);
      }

      return json.data as T;
    } catch (err: any) {
      console.error(`[API GET Error] ${action}:`, err);
      throw err;
    }
  },

  /**
   * Melakukan request POST ke Google Apps Script
   * Otomatis memicu pembersihan cache & siaran realtime ke tab/perangkat lain saat operasi berhasil.
   */
  async post<T = any>(payload: Record<string, any>): Promise<GasApiResponse<T>> {
    const baseUrl = this.getGasUrl();
    if (!baseUrl) {
      throw new Error(
        'Database belum terhubung. Konfigurasikan secret "VITE_GAS_API_URL" pada GitHub Repository Settings > Secrets and variables > Actions.'
      );
    }

    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-store',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const json: GasApiResponse<T> = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Permintaan ke database gagal diproses.');
      }

      // Siarkan perubahan data realtime ke memori lokal & tab lain
      if (payload.table) {
        memoryCache.broadcastChange(payload.table, payload.action || 'post');
      } else {
        memoryCache.invalidate();
      }

      return json;
    } catch (err: any) {
      console.error(`[API POST Error] ${payload.action}:`, err);
      throw err;
    }
  },
};
