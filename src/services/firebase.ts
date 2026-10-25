/**
 * Database Error Handler & Utilities (Google Apps Script / Sheets Compatible)
 * Retained for backward compatibility with existing component error handling.
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error(`[Database Error] Op: ${operationType}, Path: ${path}`, errMsg);
  throw new Error(errMsg);
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'Terjadi kesalahan sistem.';
  const str = error instanceof Error ? error.message : String(error);

  if (str.includes('URL Google Apps Script belum')) {
    return 'URL Google Apps Script belum diatur. Silakan atur URL Web App di menu Pengaturan.';
  }
  if (str.includes('Failed to fetch') || str.includes('NetworkError') || str.includes('Network request failed')) {
    return 'Gagal menghubungi server database Google Sheets. Periksa koneksi internet Anda atau pastikan Web App Google Apps Script telah disetel ke akses "Anyone" (Siapa saja).';
  }
  if (str.includes('permission-denied') || str.includes('insufficient permissions')) {
    return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
  }
  if (str.includes('not-found') || str.includes('tidak ditemukan')) {
    return 'Data yang diminta tidak ditemukan.';
  }
  if (str.includes('already-exists') || str.includes('sudah ada')) {
    return 'Data dengan informasi ini sudah ada di sistem.';
  }
  if (str.includes('Kata sandi salah') || str.includes('password')) {
    return 'Username atau kata sandi yang Anda masukkan tidak sesuai.';
  }
  if (str.includes('Username tidak terdaftar')) {
    return 'Username tidak terdaftar. Hubungi Admin Sekolah untuk pembuatan akun.';
  }
  if (str.includes('Jadwal bentrok')) {
    return str;
  }

  return str;
}
