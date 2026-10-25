# Panduan Lengkap: Integrasi Database Google Apps Script & Hosting GitHub Pages

Dokumen ini menjelaskan konfigurasi aman menghubungkan **Google Spreadsheet sebagai basis data** melalui **Google Apps Script** dan meng-hosting frontend di **GitHub Pages** dengan keamanan penuh (URL database disembunyikan dari UI).

---

## 🔒 Keamanan Database (Paling Aman)
Untuk menjaga kerahasiaan dan keamanan basis data sekolah, **URL Google Apps Script tidak lagi ditampilkan di menu Pengaturan aplikasi**. 

Sebagai gantinya, URL database disimpan secara privat menggunakan **GitHub Repository Secrets** dan diinjeksikan secara otomatis saat proses build oleh GitHub Actions. Dengan cara ini:
- Tidak ada pengguna / guru yang dapat melihat atau mengubah URL database melalui browser.
- URL tidak disimpan dalam kode repositori publik.
- Akses ke database tetap berjalan lancar dan aman.

---

## Langkah 1: Memasang Apps Script di Google Sheets

1. Buka [Google Drive](https://drive.google.com).
2. Buat **Google Spreadsheet baru** (misal: `Database Admin Guru`).
3. Di Spreadsheet, klik menu: **Ekstensi (Extensions)** > **Apps Script**.
4. Hapus semua teks bawaan, lalu salin dan tempelkan seluruh kode dari [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
5. Klik **Simpan (Ctrl+S)**.
6. Pilih fungsi **`initDatabase`** di dropdown atas, lalu klik **Jalankan (Run)** dan berikan izin akses Google (Review permissions > Advanced > Go to ... (unsafe) > Allow).
   *12 Sheet otomatis terbuat lengkap dengan struktur kolom.*
7. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas > **Penerapan baru (New deployment)**:
   - Jenis: **Aplikasi Web (Web app)**
   - Jalankan sebagai (Execute as): **Saya (Me)**
   - Yang memiliki akses (Who has access): **Siapa saja (Anyone)**
8. Klik **Terapkan** dan salin **URL Aplikasi Web** yang berakhiran `/exec`.

---

## Langkah 2: Menyimpan URL di GitHub Repository Secrets (Wajib)

Agar website Anda di GitHub Pages terhubung secara aman tanpa mengekspos URL:

1. Buka repositori Anda di browser:  
   👉 **https://github.com/titinrusmawati32-byte/senadminis**
2. Klik tab **Settings** (di bilah atas).
3. Di menu panel kiri, klik **Secrets and variables** > pilih **Actions**.
4. Klik tombol hijau **New repository secret**.
5. Isi formulir:
   - **Name**: `VITE_GAS_API_URL` *(Harus persis seperti ini)*
   - **Secret**: *(Tempelkan URL Google Apps Script yang berakhiran `/exec`)*
6. Klik **Add secret**.

---

## Langkah 3: Mengunggah Pembaruan ke GitHub

Setelah menambahkan secret di GitHub, kirimkan pembaruan kode ini ke repositori Anda:

```powershell
cd "C:\Users\freza\Downloads\remix-remix-remix-admin-guru---webapp-administrasi-guru-terintegrasi"
git add .
git commit -m "fix: teacher page array normalization & hide database url in settings"
git push origin main
```

Setelah di-push:
1. GitHub Actions akan otomatis berjalan (cek tab **Actions** di repositori).
2. GitHub Actions membaca secret `VITE_GAS_API_URL` dan menyertakannya ke dalam build.
3. Website Anda di `https://titinrusmawati32-byte.github.io/senadminis/` langsung terhubung ke Google Sheets secara aman!

---

## Kredensial Login Bawaan
- **Admin**: `admin` / `admin123` *(atau `admin`)*
- **Guru**: Dibuat oleh Admin di menu *Kelola Guru* (default: `guru12345`)
