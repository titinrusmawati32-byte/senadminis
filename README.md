# ADMIN GURU — WebApp Administrasi Guru Terintegrasi
### Frontend: React 19 + Vite (GitHub Pages Ready) | Backend: Google Apps Script & Google Sheets

Sistem Informasi dan Administrasi Akademik Guru Sekolah Terpadu berbasis **Google Sheets & Google Apps Script** sebagai database cloud, dengan frontend modern yang siap di-deploy ke **GitHub Pages**.

---

## 🌟 Fitur Utama
1. **Dua Peran Pengguna (Multi-Role)**:
   - **Admin Sekolah**: Pengawasan aktivitas guru, verifikasi data, kelola rombel, buat akun guru.
   - **Guru Pengampu**: Jadwal harian, presensi QR code, jurnal agenda mengajar, input nilai siswa, bimbingan konseling.
2. **Database Cloud Gratis & Mudah di Google Sheets**:
   - Seluruh data (guru, siswa, kelas, jadwal, presensi, nilai, agenda) tersimpan rapi di Google Spreadsheet Anda.
   - Tanpa biaya server / database pihak ketiga.
3. **Ekspor & Cetak Lengkap**:
   - Cetak Kartu Identitas Ber-QR Code siswa untuk presensi cepat.
   - Ekspor laporan nilai dan presensi ke format **PDF resmi (kop surat)** dan **Excel (.xlsx)**.
4. **Deploy Instan di GitHub Pages**:
   - Dilengkapi workflow GitHub Actions otomatis di `.github/workflows/deploy.yml`.

---

## 🚀 Panduan Memulai Cepat

### 1. Pasang Backend Google Apps Script
Ikuti petunjuk lengkap di **[PANDUAN_SETUP_GOOGLE_APPS_SCRIPT.md](./PANDUAN_SETUP_GOOGLE_APPS_SCRIPT.md)**:
1. Buat Google Spreadsheet baru di Google Drive.
2. Buka menu **Ekstensi > Apps Script**.
3. Salin kode dari file [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) ke editor Apps Script.
4. Klik **Jalankan** pada fungsi `initDatabase` untuk membuat 12 sheet otomatis.
5. Klik **Terapkan > Penerapan baru > Aplikasi Web** (Who has access: **Anyone**).
6. Salin URL Aplikasi Web (`.../exec`).

### 2. Jalankan Frontend Secara Lokal
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server dev lokal
npm run dev
```

Buka `http://localhost:3000` di browser Anda:
- Login sebagai Admin: Username `admin` | Password `admin123`
- Buka menu **Pengaturan**, tempelkan URL Google Apps Script Anda, dan klik **Simpan & Uji Koneksi**.

### 3. Deploy Frontend ke GitHub Pages
```bash
git init
git add .
git commit -m "feat: setup admin guru with Google Sheets database"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```
Di repositori GitHub Anda: buka **Settings > Pages > Source > GitHub Actions**.

---

## 🔑 Kredensial Default
- **Admin**: `admin` / `admin123` *(atau `admin`)*
- **Guru**: Dibuat oleh Admin di menu *Kelola Guru* (default: `guru12345`)
