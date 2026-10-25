/**
 * API Client for Google Apps Script (GAS) & Google Sheets Backend
 * Privately configured via environment variables / GitHub Secrets.
 * URL is completely hidden from the user interface for database security.
 */

// URL diinjeksikan secara aman saat proses build melalui GitHub Secrets (VITE_GAS_API_URL)
// atau berkas .env lokal pengembang, sehingga tidak terekspos di antarmuka web.
const RAW_ENV_URL = ((import.meta as any).env?.VITE_GAS_API_URL || '').trim();

// Fallback lokal jika tersimpan sebelumnya
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
   * Melakukan request GET ke Google Apps Script
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
   * Menggunakan text/plain agar browser tidak mengirim request OPTIONS yang tidak didukung oleh GAS
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

      return json;
    } catch (err: any) {
      console.error(`[API POST Error] ${payload.action}:`, err);
      throw err;
    }
  },
};
