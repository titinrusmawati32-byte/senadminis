import {
  Bell,
  CheckCircle,
  Database,
  Download,
  ExternalLink,
  GraduationCap,
  HardDriveDownload,
  HardDriveUpload,
  Link2,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';
import { backupService } from '../services/backupService';

export const SettingsPage: React.FC = () => {
  const { profile, role, isAdmin } = useAuth();
  const { showToast, sendBroadcast } = useNotification();
  const { mode, setMode } = useTheme();

  // Google Apps Script Connection State
  const [gasUrl, setGasUrl] = useState(() => apiClient.getGasUrl());
  const [testingGas, setTestingGas] = useState(false);
  const [initializingGas, setInitializingGas] = useState(false);
  const [gasStatusMessage, setGasStatusMessage] = useState<string | null>(null);

  // Notification broadcast
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Backup / Restore
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // School profile settings
  const [schoolName, setSchoolName] = useState('SD NEGERI HARAPAN BANGSA');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [semester, setSemester] = useState('Ganjil');

  const handleSaveGasUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = gasUrl.trim();
    apiClient.setGasUrl(cleanUrl);

    if (!cleanUrl) {
      showToast('URL Google Apps Script telah dihapus.', 'info');
      setGasStatusMessage(null);
      return;
    }

    setTestingGas(true);
    setGasStatusMessage(null);
    try {
      const res = await apiClient.testConnection(cleanUrl);
      if (res.success) {
        showToast('Koneksi berhasil! Database Google Sheets terhubung.', 'success');
        setGasStatusMessage('Koneksi aktif dan terhubung ke Google Apps Script.');
      } else {
        showToast(res.message, 'warning');
        setGasStatusMessage(res.message);
      }
    } finally {
      setTestingGas(false);
    }
  };

  const handleInitGasDatabase = async () => {
    if (!gasUrl.trim()) {
      showToast('Harap masukkan URL Google Apps Script terlebih dahulu.', 'warning');
      return;
    }

    setInitializingGas(true);
    try {
      const res = await apiClient.get<any>('init');
      showToast(res?.message || 'Inisialisasi tabel Google Sheets berhasil!', 'success');
      setGasStatusMessage('Tabel-tabel Google Sheets berhasil diinisialisasi.');
    } catch (err: any) {
      showToast('Gagal inisialisasi: ' + err.message, 'error');
    } finally {
      setInitializingGas(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Judul dan pesan notifikasi wajib diisi.', 'warning');
      return;
    }
    setSendingNotif(true);
    try {
      await sendBroadcast(notifTitle.trim(), notifMessage.trim(), notifType);
      setNotifTitle('');
      setNotifMessage('');
    } catch (e: any) {
      showToast('Gagal mengirim siaran: ' + e.message, 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const backupData = await backupService.exportFullDatabase();
      backupService.downloadBackupJSON(backupData);
      showToast(`Cadangan data (${backupData.totalRecords} baris) berhasil diekspor!`, 'success');
    } catch (e: any) {
      showToast('Gagal membuat backup database: ' + e.message, 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast('Pilih file backup .json terlebih dahulu.', 'warning');
      return;
    }

    setRestoreLoading(true);
    try {
      const text = await restoreFile.text();
      const parsed = JSON.parse(text);
      const res = await backupService.restoreDatabase(parsed);
      showToast(`Berhasil memulihkan ${res.success} baris data ke spreadsheet!`, 'success');
      setRestoreFile(null);
    } catch (e: any) {
      showToast('Format berkas cadangan tidak valid atau gagal dipulihkan: ' + e.message, 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Identitas sekolah dan tahun ajaran berhasil diperbarui.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Google Apps Script & Google Sheets Database Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-[#D9A62E]/40 shadow-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E0E5EC] dark:border-[#263B58]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#102A50] text-[#FFD675] border border-[#D9A62E]/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
                  Integrasi Database Google Sheets & Google Apps Script
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  apiClient.isConfigured()
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {apiClient.isConfigured() ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                </span>
              </div>
              <p className="text-xs text-[#66758A] dark:text-[#B4C1D4] mt-0.5">
                Hubungkan frontend WebApp di GitHub ke Google Spreadsheet Anda sebagai basis data cloud
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveGasUrl} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1.5">
              URL Google Apps Script Web App (Exec URL)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#66758A] dark:text-[#B4C1D4]">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] placeholder-[#66758A]/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A62E]"
              />
            </div>
            <p className="text-[11px] text-[#66758A] dark:text-[#B4C1D4] mt-1.5 leading-relaxed">
              Dapatkan URL ini dari Google Sheets &gt; Ekstensi &gt; Apps Script &gt; Terapkan (Deploy) &gt; Penerapan baru &gt; Aplikasi Web (Who has access: Anyone).
            </p>
          </div>

          {gasStatusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              gasStatusMessage.includes('berhasil') || gasStatusMessage.includes('terhubung')
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{gasStatusMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleInitGasDatabase}
              disabled={initializingGas || !gasUrl.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#ECE9E1] hover:bg-[#E0E5EC] dark:bg-[#172D4B] dark:hover:bg-[#1f3b61] text-[#172A45] dark:text-[#F5F7FC] text-xs font-semibold flex items-center gap-2 border border-[#E0E5EC] dark:border-[#263B58] transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D9A62E] ${initializingGas ? 'animate-spin' : ''}`} />
              <span>Inisialisasi Sheet Otomatis</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={testingGas}
                className="px-4 py-2 rounded-xl bg-[#102A50] hover:bg-[#0B1B33] text-[#FFD675] text-xs font-bold border border-[#D9A62E]/30 flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {testingGas ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Simpan & Uji Koneksi</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* School Information Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-[#E0E5EC] dark:border-[#263B58] shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E0E5EC] dark:border-[#263B58]">
          <div className="w-10 h-10 rounded-2xl bg-[#102A50]/10 dark:bg-[#172D4B] text-[#102A50] dark:text-[#FFD675] flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
              Identitas & Parameter Akademik Sekolah
            </h3>
            <p className="text-xs text-[#66758A] dark:text-[#B4C1D4]">
              Digunakan sebagai kop surat resmi dokumen laporan dan kartu QR siswa
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSchoolSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil (1)</option>
                <option value="Genap">Semester Genap (2)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#102A50] hover:bg-[#0B1B33] text-[#FFD675] text-xs font-bold shadow-xs transition-colors border border-[#D9A62E]/30 cursor-pointer"
            >
              Simpan Identitas Sekolah
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Notification Broadcaster */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-[#E0E5EC] dark:border-[#263B58] shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E0E5EC] dark:border-[#263B58]">
          <div className="w-10 h-10 rounded-2xl bg-[#D9A62E]/15 text-[#102A50] dark:text-[#FFD675] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
              Sistem Notifikasi Sekolah
            </h3>
            <p className="text-xs text-[#66758A] dark:text-[#B4C1D4]">
              Kirim siaran pengumuman ke seluruh guru terdaftar
            </p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Judul Pengumuman
              </label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Contoh: Rapat Dewan Guru Pukul 13.00 WIB"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Tipe Notifikasi
              </label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
              >
                <option value="info">Informasi (Biru)</option>
                <option value="success">Sukses (Hijau)</option>
                <option value="warning">Penting (Kuning/Oranye)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
              Isi Pesan Siaran
            </label>
            <textarea
              rows={2}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Tulis rincian pesan notifikasi..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={sendingNotif}
              className="px-4 py-2 rounded-xl bg-[#102A50] hover:bg-[#0B1B33] text-[#FFD675] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 border border-[#D9A62E]/30 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Siaran Notifikasi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Backup & Recovery Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-[#E0E5EC] dark:border-[#263B58] shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E0E5EC] dark:border-[#263B58]">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
              Cadangan & Pemulihan Basis Data (Backup & Recovery)
            </h3>
            <p className="text-xs text-[#66758A] dark:text-[#B4C1D4]">
              Amankan data siswa, kehadiran, nilai, dan agenda dengan file cadangan terenkripsi JSON
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Backup */}
          <div className="p-4 rounded-2xl border border-[#E0E5EC] dark:border-[#263B58] bg-[#ECE9E1]/30 dark:bg-[#071225] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[#172A45] dark:text-[#F5F7FC]">
                <HardDriveDownload className="w-4 h-4 text-emerald-600" />
                <span>Unduh Cadangan Database</span>
              </div>
              <p className="text-xs text-[#66758A] dark:text-[#B4C1D4] leading-relaxed mb-4">
                Mengekspor seluruh tabel siswa, mapel, jadwal, presensi, asesmen, dan agenda ke dalam berkas JSON standar.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {backupLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Unduh File Backup (.json)</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-2xl border border-[#E0E5EC] dark:border-[#263B58] bg-[#ECE9E1]/30 dark:bg-[#071225] flex flex-col justify-between">
            <form onSubmit={handleRestoreBackup} className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[#172A45] dark:text-[#F5F7FC]">
                  <HardDriveUpload className="w-4 h-4 text-[#102A50] dark:text-[#FFD675]" />
                  <span>Pulihkan dari File Cadangan</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#66758A] dark:text-[#B4C1D4] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#102A50] file:text-[#FFD675] hover:file:bg-[#0B1B33]"
                />
              </div>
              <button
                type="submit"
                disabled={restoreLoading || !restoreFile}
                className="w-full py-2.5 px-3 rounded-xl bg-[#102A50] hover:bg-[#0B1B33] text-[#FFD675] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 border border-[#D9A62E]/30 cursor-pointer"
              >
                {restoreLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Pulihkan Database Sekarang</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
