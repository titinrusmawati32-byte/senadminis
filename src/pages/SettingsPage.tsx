import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  GraduationCap,
  HardDriveDownload,
  HardDriveUpload,
  Lock,
  QrCode,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Upload,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';
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

  // Multi-device sync modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Manual connect for unconfigured device (e.g. HP)
  const [manualUrl, setManualUrl] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const isDbConfigured = apiClient.isConfigured();
  const currentGasUrl = apiClient.getGasUrl();

  // URL untuk sinkronisasi instan ke HP via QR code atau Link WhatsApp
  const syncUrl = typeof window !== 'undefined' && currentGasUrl
    ? `${window.location.origin}${window.location.pathname}?db_url=${encodeURIComponent(currentGasUrl)}`
    : '';

  const handleCopySyncLink = () => {
    if (!syncUrl) return;
    navigator.clipboard.writeText(syncUrl);
    setCopiedLink(true);
    showToast('Tautan aktivasi HP berhasil disalin! Silakan kirimkan ke WhatsApp HP Anda.', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleConnectManual = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualUrl.trim();
    if (!clean.startsWith('http') || !clean.includes('/exec')) {
      showToast('URL Google Apps Script tidak valid. Harus diawali https:// dan berakhiran /exec', 'error');
      return;
    }
    setSavingManual(true);
    try {
      localStorage.setItem('admin_guru_gas_url', clean);
      showToast('Perangkat HP berhasil terhubung ke Database Cloud!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {
      showToast('Gagal menyimpan konfigurasi pada perangkat.', 'error');
      setSavingManual(false);
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
      showToast('Siaran pengumuman berhasil dikirimkan ke seluruh pengguna!', 'success');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      showToast('Gagal mengirim siaran: ' + err.message, 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      const backup = await backupService.exportFullDatabase();
      backupService.downloadBackupJSON(backup);
      showToast('Cadangan basis data berhasil diunduh (JSON).', 'success');
    } catch (err: any) {
      showToast('Gagal mencadangkan data: ' + err.message, 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast('Pilih berkas cadangan JSON terlebih dahulu.', 'warning');
      return;
    }

    setRestoreLoading(true);
    try {
      const text = await restoreFile.text();
      const json = JSON.parse(text);
      if (!json.data || !json.timestamp) {
        throw new Error('Format berkas cadangan tidak valid.');
      }
      const res = await backupService.restoreDatabase(json);
      showToast(`Pemulihan selesai! ${res.success} dokumen berhasil dipulihkan.`, 'success');
      setRestoreFile(null);
    } catch (err: any) {
      showToast('Gagal memulihkan database: ' + err.message, 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('school_name', schoolName);
    localStorage.setItem('academic_year', academicYear);
    localStorage.setItem('semester', semester);
    showToast('Identitas sekolah dan tahun ajaran berhasil diperbarui.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Keamanan & Proteksi Database Card */}
      <div className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border shadow-md ${
        isDbConfigured ? 'border-emerald-500/30' : 'border-amber-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDbConfigured
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
            }`}>
              {isDbConfigured ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
                  Keamanan & Privasi Database Cloud
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isDbConfigured
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {isDbConfigured ? 'Terkoneksi & Terproteksi' : 'Perangkat Belum Terhubung'}
                </span>
              </div>
              <p className="text-xs text-[#66758A] dark:text-[#B4C1D4] mt-1 leading-relaxed">
                {isDbConfigured
                  ? 'Perangkat ini terhubung aman ke Google Sheets via Google Apps Script. URL database dirahasiakan dan diproteksi.'
                  : 'Perangkat ini belum terhubung ke Google Sheets, sehingga data masih kosong. Hubungkan sekali melalui QR Code atau tautan aktivasi.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isDbConfigured && isAdmin && (
              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                title="Buka QR code untuk menghubungkan HP"
              >
                <Smartphone className="w-4 h-4" />
                <span>Hubungkan HP / Perangkat Lain</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Akses Terenkripsi</span>
            </span>
          </div>
        </div>

        {/* Jika perangkat ini BELUM terhubung (misalnya saat baru dibuka di HP) */}
        {!isDbConfigured && (
          <div className="mt-5 pt-4 border-t border-amber-500/20 space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Kenapa data masih kosong di perangkat ini?</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  Perangkat ini belum menyimpan URL koneksi cloud. Anda memiliki 2 cara mudah untuk menghubungkannya:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                  <li><strong>Cara Cepat:</strong> Buka menu Pengaturan di <strong>Laptop Admin</strong> Anda, lalu klik tombol biru <em>"Hubungkan HP"</em> dan scan QR codenya menggunakan kamera HP ini.</li>
                  <li><strong>Cara Langsung:</strong> Tempelkan URL Web App Apps Script Anda di formulir privat di bawah ini.</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleConnectManual} className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Aktivasi Langsung di Perangkat Ini (URL Disamarkan):
              </label>
              <div className="relative">
                <input
                  type={showManualUrl ? 'text' : 'password'}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-20 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showManualUrl ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showManualUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Hubungkan Database Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL SINKRONISASI HP / PERANGKAT LAIN (DIBUKA DARI LAPTOP) */}
      <Modal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Hubungkan HP & Perangkat Lain ke Database"
        subtitle="Akses instan tanpa perlu mengetik ulang URL di smartphone"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Cukup <strong>scan Kode QR</strong> di bawah menggunakan kamera smartphone Anda, atau klik <strong>Salin Tautan</strong> lalu kirimkan via WhatsApp ke HP Anda. Sekali dibuka, HP Anda langsung otomatis terhubung ke database yang sama!
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner space-y-3">
            {syncUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <QRCodeSVG value={syncUrl} size={190} level="M" />
              </div>
            ) : (
              <p className="text-slate-400 italic">URL Database belum terdeteksi di perangkat ini.</p>
            )}
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">
              Arahkan kamera HP ke QR Code di atas untuk membuka web langsung terkoneksi
            </p>
          </div>

          {/* Alternatif Copy Link */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              Atau Kirimkan Tautan Aktivasi Satu-Kali:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySyncLink}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Aktivasi untuk HP'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              *Tautan ini otomatis menghapus parameter rahasia dari address bar HP setelah dibuka, demi privasi.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowSyncModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

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
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#102A50] dark:bg-[#D9A62E] text-white dark:text-[#0A1628] font-bold text-xs shadow-sm hover:opacity-95 transition-all cursor-pointer"
            >
              Simpan Identitas
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast Notification (Admin Only) */}
      {isAdmin && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-[#E0E5EC] dark:border-[#263B58] shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E0E5EC] dark:border-[#263B58]">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
                Kirim Notifikasi Siaran (Broadcast)
              </h3>
              <p className="text-xs text-[#66758A] dark:text-[#B4C1D4]">
                Kirim pengumuman langsung yang akan muncul di lonceng notifikasi seluruh guru
              </p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Judul Notifikasi
              </label>
              <input
                type="text"
                placeholder="Contoh: Rapat Dewan Guru Jam 13:00"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172A45] dark:text-[#F5F7FC] mb-1">
                Pesan Notifikasi
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan isi pengumuman atau instruksi untuk seluruh guru..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E0E5EC] dark:border-[#263B58] bg-white dark:bg-[#172D4B] text-[#172A45] dark:text-[#F5F7FC] focus:ring-2 focus:ring-[#D9A62E] focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#66758A] dark:text-[#B4C1D4]">
                  Tipe Notifikasi:
                </span>
                {(['info', 'success', 'warning'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNotifType(t)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      notifType === t
                        ? t === 'info'
                          ? 'bg-blue-600 text-white'
                          : t === 'success'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={sendingNotif}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingNotif ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Kirim Siaran Sekarang</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backup and Restore (Admin Only) */}
      {isAdmin && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#10223D] border border-[#E0E5EC] dark:border-[#263B58] shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E0E5EC] dark:border-[#263B58]">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172A45] dark:text-[#F5F7FC]">
                Cadangan Data & Pemulihan (Backup & Restore)
              </h3>
              <p className="text-xs text-[#66758A] dark:text-[#B4C1D4]">
                Unduh berkas JSON cadangan seluruh data sekolah atau pulihkan data dari berkas sebelumnya
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Export */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172D4B]/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#172A45] dark:text-[#F5F7FC] flex items-center gap-2">
                  <HardDriveDownload className="w-4 h-4 text-emerald-500" />
                  <span>Cadangkan Seluruh Basis Data</span>
                </h4>
                <p className="text-[11px] text-[#66758A] dark:text-[#B4C1D4] mt-1">
                  Mengekspor seluruh tabel (guru, siswa, kelas, jadwal, presensi, asesmen, dll.) menjadi 1 berkas aman `.json`.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={backupLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {backupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{backupLoading ? 'Mengunduh Cadangan...' : 'Unduh Cadangan Lengkap (.json)'}</span>
              </button>
            </div>

            {/* Restore */}
            <form onSubmit={handleRestoreDatabase} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172D4B]/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#172A45] dark:text-[#F5F7FC] flex items-center gap-2">
                  <HardDriveUpload className="w-4 h-4 text-blue-500" />
                  <span>Pulihkan Data dari Berkas Cadangan</span>
                </h4>
                <p className="text-[11px] text-[#66758A] dark:text-[#B4C1D4] mt-1">
                  Pilih berkas `.json` hasil cadangan sebelumnya untuk menyalin kembali data ke cloud spreadsheet.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={restoreLoading || !restoreFile}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {restoreLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{restoreLoading ? 'Memulihkan Data...' : 'Mulai Pulihkan Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
