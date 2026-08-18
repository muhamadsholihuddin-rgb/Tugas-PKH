// Dipanggil otomatis tiap hari oleh Vercel Cron (lihat vercel.json).
// Mengecek tugas yang deadline-nya H-1 atau hari H, lalu kirim Web Push
// ke semua pendamping yang sudah subscribe (tokennya tersimpan di koleksi "subscriptions").
//
// CATATAN: butuh library `web-push` + VAPID keys. Lihat README.md bagian
// "Aktifkan Notifikasi Push" untuk langkah setup lengkapnya sebelum route ini
// bisa jalan sungguhan (saat ini masih kerangka/skeleton).

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // TODO setelah setup Firebase Admin SDK:
    // 1. Ambil semua dokumen di koleksi "tasks" dari Firestore (pakai firebase-admin)
    // 2. Hitung selisih hari ke deadline tiap tugas
    // 3. Untuk tugas dengan selisih 1 hari (H-1) atau 0 hari (hari H) dan belum
    //    ditandai notifiedH1/notifiedH0, ambil semua token dari koleksi "subscriptions"
    // 4. Kirim via web-push, lalu tandai notifiedH1/notifiedH0 = true di Firestore

    res.status(200).json({ ok: true, message: "Endpoint siap, tinggal isi logic Firebase Admin." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses pengecekan deadline" });
  }
}
