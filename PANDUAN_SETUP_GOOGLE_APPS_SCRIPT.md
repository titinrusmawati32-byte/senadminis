# Panduan Lengkap: Migrasi Database ke Google Apps Script (Google Sheets) & Hosting Frontend di GitHub

Dokumen ini menjelaskan langkah demi langkah cara menggunakan **Google Spreadsheet sebagai basis data** melalui **Google Apps Script** sebagai REST API backend, serta menaruh frontend di **GitHub / GitHub Pages**.

---

## DAFTAR ISI
1. [Langkah 1: Membuat Google Spreadsheet & Memasang Apps Script](#langkah-1-membuat-google-spreadsheet--memasang-apps-script)
2. [Langkah 2: Melakukan Deployment Web App di Google Apps Script](#langkah-2-melakukan-deployment-web-app-di-google-apps-script)
3. [Langkah 3: Menghubungkan Web App ke Google Apps Script](#langkah-3-menghubungkan-web-app-ke-google-apps-script)
4. [Langkah 4: Mengunggah Frontend ke GitHub & Deploy GitHub Pages](#langkah-4-mengunggah-frontend-ke-github--deploy-github-pages)
5. [Struktur 12 Sheet / Tabel di Google Spreadsheet](#struktur-12-sheet--tabel-di-google-spreadsheet)
6. [Kredensial Login Default](#kredensial-login-default)
7. [Tanya Jawab & Pemecahan Masalah (Troubleshooting)](#tanya-jawab--pemecahan-masalah-troubleshooting)

---

## Langkah 1: Membuat Google Spreadsheet & Memasang Apps Script

1. Buka [Google Drive](https://drive.google.com).
2. Klik tombol **+ Baru (New)** > **Google Spreadsheet (Google Sheets)**.
3. Beri nama spreadsheet Anda, misalnya: `Database Admin Guru Terpadu`.
4. Di bilah menu atas Google Sheets, klik menu:
   **Ekstensi (Extensions)** > **Apps Script**.
5. Jendela editor Google Apps Script akan terbuka.
6. Hapus semua teks bawaan (`function myFunction() { ... }`).
7. Buka file [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) di folder proyek ini, salin seluruh kodenya, dan tempelkan (*paste*) ke editor Apps Script tersebut.
8. Klik ikon **Simpan (Save)** atau tekan `Ctrl + S`.
9. Di dropdown fungsi bagian atas editor, pastikan fungsi **`initDatabase`** terpilih.
10. Klik tombol **Jalankan (Run)**.
    - Google akan menampilkan jendela izin akses: *"Authorization Required"*.
    - Klik **Tinjau izin (Review permissions)**.
    - Pilih akun Google Anda.
    - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Lanjutan (Advanced)** di kiri bawah > klik **Buka Database Admin Guru (tidak aman) / Go to ... (unsafe)**.
    - Klik **Izinkan (Allow)**.
11. Buka kembali tab Google Spreadsheet Anda. Anda akan melihat **12 sheet otomatis terbuat** lengkap dengan baris header berwarna Navy & Gold serta data kelas dan admin default!

---

## Langkah 2: Melakukan Deployment Web App di Google Apps Script

Agar frontend web Anda dapat membaca dan menulis data ke spreadsheet, script harus dijadikan Aplikasi Web (Web App):

1. Di editor Google Apps Script, klik tombol biru **Terapkan (Deploy)** di pojok kanan atas > pilih **Penerapan baru (New deployment)**.
2. Klik ikon gerigi (roda gigi) di samping *Pilih jenis* > pilih **Aplikasi Web (Web app)**.
3. Isi kolom pengaturan sebagai berikut:
   - **Deskripsi (Description)**: `Admin Guru API v1`
   - **Jalankan sebagai (Execute as)**: **Saya (Me / <email anda>)** *(Wajib)*
   - **Yang memiliki akses (Who has access)**: **Siapa saja (Anyone)** *(Wajib agar frontend dapat terhubung tanpa login Google berulang kali)*
4. Klik tombol **Terapkan (Deploy)**.
5. Salin teks yang ada di bagian **Aplikasi Web > URL (Web app URL)**.
   Format URL akan seperti ini:
   ```text
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
   *(Pastikan berakhiran `/exec`, bukan `/dev`)*.

---

## Langkah 3: Menghubungkan Web App ke Google Apps Script

Anda dapat menghubungkan URL Web App langsung melalui antarmuka web:

1. Buka aplikasi Admin Guru di browser.
2. Login sebagai admin:
   - **Username**: `admin`
   - **Password**: `admin123` *(atau `admin`)*
3. Masuk ke menu **Pengaturan** di sidebar kiri.
4. Di kartu paling atas **"Integrasi Database Google Sheets & Google Apps Script"**, tempelkan URL Google Apps Script yang telah Anda salin pada Langkah 2.
5. Klik tombol **Simpan & Uji Koneksi**.
6. Sistem akan memverifikasi koneksi dan menampilkan lencana hijau bertuliskan *"Koneksi aktif dan terhubung ke Google Apps Script"*.

> **Tips Opsional**: Jika Anda ingin URL ini langsung terpasang saat proses build di GitHub Actions, Anda dapat menyalin file `.env.example` menjadi `.env` dan mengisi:
> ```env
> VITE_GAS_API_URL="https://script.google.com/macros/s/AKfycb.../exec"
> ```

---

## Langkah 4: Mengunggah Frontend ke GitHub & Deploy GitHub Pages

Proyek ini telah dilengkapi dengan pengaturan `base: './'` di `vite.config.ts` dan workflow otomatis di `.github/workflows/deploy.yml`.

### A. Inisialisasi Git & Push ke GitHub

Jalankan perintah berikut di terminal folder proyek:

```bash
# 1. Inisialisasi Git jika belum
git init

# 2. Tambahkan seluruh berkas
git add .

# 3. Commit pertama
git commit -m "feat: migrate backend to Google Apps Script & Sheets"

# 4. Hubungkan ke repositori GitHub Anda
git remote add origin https://github.com/<USERNAME-ANDA>/<NAMA-REPO-ANDA>.git

# 5. Push ke branch main
git branch -M main
git push -u origin main
```

### B. Mengaktifkan GitHub Pages

1. Buka halaman repositori Anda di GitHub.
2. Buka tab **Settings** > menu **Pages** di sebelah kiri.
3. Di bagian **Build and deployment > Source**, ubah pilihan menjadi:
   **GitHub Actions**.
4. Workflow di `.github/workflows/deploy.yml` akan otomatis berjalan untuk mem-build dan mempublikasikan situs Anda.
5. Dalam 1-2 menit, situs Anda akan live di:
   `https://<username>.github.io/<nama-repo>/`

### C. Menambahkan Secret URL di GitHub (Opsional)

Jika ingin URL Google Apps Script otomatis terpasang saat build GitHub Actions:
1. Di repositori GitHub, buka **Settings** > **Secrets and variables** > **Actions**.
2. Klik **New repository secret**.
3. Name: `VITE_GAS_API_URL`
4. Secret: *(tempel URL Web App Google Apps Script Anda)*
5. Klik **Add secret**.

---

## Struktur 12 Sheet / Tabel di Google Spreadsheet

Saat fungsi `initDatabase` dijalankan, Google Apps Script akan otomatis membuat sheet berikut:

| Nama Sheet | Keterangan Data |
| :--- | :--- |
| **`users`** | Akun Guru & Administrator, hak akses, NIP, nomor telepon, dan status akun |
| **`students`** | Data peserta didik, NIS, NISN, nama, kelas, gender, dan ID QR Code |
| **`classes`** | Rombongan belajar (Kelas 1A s/d 6B), tingkat, tahun ajaran |
| **`subjects`** | Mata pelajaran (Kurikulum Merdeka / Umum / Mulok) |
| **`schedules`** | Jadwal mengajar mingguan guru per hari, jam, kelas, dan ruang |
| **`attendance`** | Data presensi harian siswa (metode scan kamera QR maupun rombel) |
| **`assessments`** | Penilaian formatif, sumatif, tugas, dan rekap nilai per siswa |
| **`teaching_agendas`**| Jurnal harian agenda guru, topik materi, tujuan, dan ketercapaian |
| **`guidance`** | Catatan bimbingan konseling dan penanganan siswa oleh wali kelas |
| **`notifications`** | Siaran notifikasi dan pengumuman sekolah |
| **`audit_logs`** | Catatan riwayat aktivitas guru dan admin di sistem |
| **`settings`** | Parameter identitas sekolah, tahun ajaran, dan semester aktif |

---

## Kredensial Login Default

| Peran | Username | Password Bawaan | Catatan |
| :--- | :--- | :--- | :--- |
| **Admin Master** | `admin` | `admin123` *(atau `admin`)* | Pengelola utama sekolah & akun guru |
| **Guru** | Dibuat Admin | `guru12345` | Didaftarkan oleh Admin melalui menu *Kelola Guru* |

---

## Tanya Jawab & Pemecahan Masalah (Troubleshooting)

### Q: Muncul pesan "CORS Error" atau "Failed to fetch" saat klik tombol Simpan & Uji Koneksi?
- **Penyebab**: Saat melakukan deployment di Apps Script, opsi *"Who has access"* dipilih selain *"Anyone"*.
- **Solusi**: Di Google Apps Script, klik **Terapkan (Deploy)** > **Kelola penerapan (Manage deployments)** > Edit deployment > Ubah **Yang memiliki akses** menjadi **Siapa saja (Anyone)** > Klik **Terapkan**.

### Q: Muncul peringatan "Script function not found: doGet"?
- Pastikan seluruh isi file [`Code.gs`](./google-apps-script/Code.gs) telah tersalin lengkap tanpa terpotong, lalu klik Simpan dan deploy ulang dengan versi baru (*New version*).

### Q: Apakah data di Google Sheets dapat diedit manual?
- **Ya!** Anda bisa langsung membuka Google Spreadsheet, mengedit nilai cell, menyalin baris data siswa dari file Excel lain ke sheet `students`, atau mengubah nama guru di sheet `users`. Perubahan akan langsung terbaca oleh WebApp saat refresh.
