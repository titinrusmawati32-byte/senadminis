/**
 * API Client for Google Apps Script (GAS) & Google Sheets Backend
 * Handles GET/POST communication, URL configuration, and error management.
 */

const STORAGE_KEY_GAS_URL = 'admin_guru_gas_url';

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
   * Mendapatkan URL Google Apps Script Web App yang aktif.
   * Urutan prioritas:
   * 1. Nilai yang disimpan user di localStorage (pengaturan aplikasi)
   * 2. Environment variable VITE_GAS_API_URL
   */
  getGasUrl(): string {
    const fromStorage = localStorage.getItem(STORAGE_KEY_GAS_URL);
    if (fromStorage && fromStorage.trim()) {
      return fromStorage.trim();
    }
    const fromEnv = (import.meta as any).env?.VITE_GAS_API_URL;
    if (fromEnv && String(fromEnv).trim()) {
      return String(fromEnv).trim();
    }
    return '';
  },

  /**
   * Menyimpan URL Google Apps Script Web App ke localStorage.
   */
  setGasUrl(url: string): void {
    const clean = (url || '').trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY_GAS_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_GAS_URL);
    }
  },

  /**
   * Mengecek apakah URL Google Apps Script telah dikonfigurasi.
   */
  isConfigured(): boolean {
    const url = this.getGasUrl();
    return Boolean(url && url.startsWith('http') && url.includes('/exec'));
  },

  /**
   * Menguji koneksi ke endpoint Google Apps Script
   */
  async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string; version?: string }> {
    const url = (targetUrl || this.getGasUrl()).trim();
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
      const res = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          message: json.message || 'Koneksi ke Google Apps Script berhasil!',
          version: json.version,
        };
      }
      return {
        success: false,
        message: json.error || 'Server merespons tetapi mengembalikan status gagal.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message || String(err)}. Pastikan Web App di-deploy dengan akses 'Anyone'.`,
      };
    }
  },

  /**
   * Melakukan request GET ke Google Apps Script
   */
  async get<T = any>(action: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    const baseUrl = this.getGasUrl();
    if (!baseUrl) {
      throw new Error(
        'URL Google Apps Script belum dikonfigurasi. Silakan buka menu Pengaturan untuk memasukkan URL Web App Anda.'
      );
    }

    const urlObj = new URL(baseUrl);
    urlObj.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        urlObj.searchParams.set(k, String(v));
      }
    }

    try {
      const res = await fetch(urlObj.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const json: GasApiResponse<T> = await res.json();
      if (!json.success) {
        throw new Error(json.error || `Aksi "${action}" gagal diproses oleh Google Apps Script.`);
      }

      return json.data as T;
    } catch (err: any) {
      console.error(`[API GET Error] ${action}:`, err);
      throw err;
    }
  },

  /**
   * Melakukan request POST ke Google Apps Script
   * Catatan penting: Menggunakan Content-Type text/plain untuk menghindari preflight CORS OPTIONS pada browser.
   */
  async post<T = any>(payload: Record<string, any>): Promise<GasApiResponse<T>> {
    const baseUrl = this.getGasUrl();
    if (!baseUrl) {
      throw new Error(
        'URL Google Apps Script belum dikonfigurasi. Silakan buka menu Pengaturan untuk memasukkan URL Web App Anda.'
      );
    }

    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        redirect: 'follow',
        // Menggunakan text/plain agar browser tidak mengirim request OPTIONS yang tidak didukung oleh GAS
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
        throw new Error(json.error || `Permintaan ke server gagal diproses.`);
      }

      return json;
    } catch (err: any) {
      console.error(`[API POST Error] ${payload.action}:`, err);
      throw err;
    }
  },
};
