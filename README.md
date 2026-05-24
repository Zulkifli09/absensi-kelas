# Absensi Kelas Pixel

Aplikasi absensi kelas pribadi untuk ketua tingkat. Bisa dipasang sebagai PWA, menyimpan data lokal di browser, export CSV, backup/import JSON, dan sinkronisasi opsional ke Supabase.

## Jalan Lokal

```bash
npm install
npm run dev
```

Buka `http://127.0.0.1:5173`.

## PWA

Setelah dideploy dengan HTTPS di Vercel, buka website di Chrome/Edge lalu pilih `Install app` atau `Add to Home Screen`.

## Backup Data

Gunakan tombol `Backup JSON` untuk menyimpan seluruh data lokal ke file. Gunakan `Import JSON` untuk memulihkan data ke browser/perangkat lain.

## Supabase Pribadi

1. Buat project di Supabase.
2. Buka SQL Editor, jalankan isi file `supabase.sql`.
3. Aktifkan Email Auth/Magic Link di Supabase Authentication.
4. Di Vercel, tambahkan environment variable:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

5. Redeploy Vercel.

Tidak ada role admin/kelas. Setiap akun hanya bisa membaca dan menyimpan data miliknya sendiri lewat Row Level Security.
