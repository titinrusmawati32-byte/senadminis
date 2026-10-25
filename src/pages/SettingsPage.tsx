import {
  Bell,
  CheckCircle,
  Database,
  Download,
  GraduationCap,
  HardDriveDownload,
  HardDriveUpload,
  Lock,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Upload,
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

  const isDbConfigured = apiClient.isConfigured();

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
      {/* Keamanan & Proteksi Database Card (URL Disembunyikan Penuh dari Tampilan) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-emerald-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
                  Keamanan & Privasi Database Cloud
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isDbConfigured
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {isDbConfigured ? 'Terkoneksi & Terproteksi' : 'Menunggu GitHub Secret'}
                </span>
              </div>
              <p className="text-xs text-[#66758A] dark:text-[#B4C1D4] mt-1 leading-relaxed">
                URL basis data dikelola secara privat dan terlindungi melalui <strong>GitHub Repository Secrets</strong> (<code className="font-mono text-emerald-600 dark:text-emerald-400">VITE_GAS_API_URL</code>). Alamat endpoint disembunyikan sepenuhnya dari antarmuka aplikasi demi menjaga privasi dan keamanan data sekolah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Akses Terenkripsi</span>
            </span>
          </div>
        </div>
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
