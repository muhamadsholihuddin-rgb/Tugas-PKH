# Tugas & Jurnal Pendamping PKH

Aplikasi web (PWA) untuk:
1. **Daftar Tugas** — admin (kamu) insert link tugas + target + deadline, semua pendamping bisa lihat & install ke HP langsung dari URL, dapat notifikasi H-1 dan hari H.
2. **Jurnal Pendamping** — tiap pendamping ketik nama sendiri sekali di awal, lalu catat kegiatan harian sesuai kategori RHK (data tersimpan di HP + sinkron ke server).

## Struktur Project

```
pages/
  index.js        -> Halaman publik: daftar tugas
  jurnal.js        -> Halaman jurnal pendamping
  admin.js         -> Halaman admin (login + kelola tugas)
  api/check-deadlines.js -> Endpoint cron pengecekan deadline (kerangka, lihat langkah 5)
data/rhkConfig.js  -> Daftar 9 kategori RHK
lib/                -> Koneksi Firebase, helper localStorage, hook install PWA
public/manifest.json, sw.js -> Konfigurasi PWA (install & push notification)
firestore.rules      -> Contoh aturan keamanan Firestore
vercel.json          -> Jadwal cron harian
```

## Langkah Setup

### 1. Buat project Firebase
1. Buka https://console.firebase.google.com → **Add project** (gratis, paket Spark cukup).
2. Di dalam project, buka **Build > Authentication** → tab **Sign-in method** → aktifkan **Email/Password** (untuk login admin) dan **Anonymous** (dipakai otomatis untuk fitur jurnal).
3. Buat akun admin: tab **Users** → **Add user** → isi email & password yang nanti kamu pakai login di `/admin`.
4. Buka **Build > Firestore Database** → **Create database** → mode production, pilih lokasi terdekat (misal `asia-southeast2`).
5. Di tab **Rules**, tempel isi file `firestore.rules` dari project ini, lalu **Publish**.
6. Buka **Project settings** (ikon gerigi) → scroll ke **Your apps** → klik ikon web (`</>`) → daftarkan app → salin nilai `firebaseConfig` yang muncul.

### 2. Isi environment variables
1. Copy `.env.local.example` jadi `.env.local`.
2. Isi tiap `NEXT_PUBLIC_FIREBASE_...` dengan nilai dari `firebaseConfig` di langkah 1.6.
3. Isi `CRON_SECRET` dengan string acak (bebas, buat untuk keamanan endpoint cron).

### 3. Jalankan di komputer (opsional, untuk uji coba dulu)
```bash
npm install
npm run dev
```
Buka `http://localhost:3000`.

### 4. Deploy ke Vercel
1. Push folder ini ke repo GitHub.
2. Buka https://vercel.com → **Add New Project** → import repo tadi.
3. Saat setup, masukkan semua environment variable yang sama seperti di `.env.local` (termasuk `CRON_SECRET`).
4. Deploy. Setelah selesai kamu dapat URL seperti `https://tugas-pendamping.vercel.app`.
5. Buka URL itu di Chrome Android → akan muncul banner/opsi **"Pasang di HP kamu"** untuk install PWA.

### 5. Aktifkan Notifikasi Push (langkah lanjutan, boleh nyusul)
Bagian ini belum otomatis jalan di kode saat ini (masih kerangka di `pages/api/check-deadlines.js`) karena butuh:
1. Generate **VAPID keys** (`npx web-push generate-vapid-keys`) untuk Web Push.
2. Tambah kode di frontend untuk minta izin notifikasi (`Notification.requestPermission()`) dan simpan push subscription ke Firestore koleksi `subscriptions`.
3. Install `firebase-admin` dan `web-push` di project, lalu lengkapi logic di `check-deadlines.js` sesuai TODO yang sudah ditulis di file itu.
4. Vercel Cron (`vercel.json`) akan otomatis memanggil endpoint ini tiap hari jam 08:00 WIB.

Kalau sudah siap ke tahap ini, tinggal bilang — nanti kita lengkapi bersama.

## Admin

Buka `/admin`, login pakai email & password yang dibuat di langkah 1.3, lalu tambah tugas (judul, link, target, deadline).

## Catatan Desain

- Warna teal-hijau melambangkan pertumbuhan/harapan, amber untuk urgensi mendekati deadline, ember/merah-bata untuk lewat tenggat.
- "Busur urgensi" di tiap kartu tugas berubah warna sesuai jarak ke deadline (H-berapa).
