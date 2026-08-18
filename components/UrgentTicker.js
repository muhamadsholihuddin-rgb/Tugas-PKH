import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getUrgency } from "../lib/urgency";

// Teks berjalan yang muncul otomatis kalau ada tugas dengan sisa waktu H-3
// ke bawah (termasuk yang sudah lewat tenggat). Komponen ini juga menampilkan
// custom alert text jika admin menambahkan pesan darurat tertentu.
//
// Custom text dibaca secara realtime dari Firestore (settings/ticker), BUKAN
// localStorage — supaya pesan yang disimpan admin dari device manapun langsung
// terlihat oleh semua user, bukan cuma di browser yang sama dengan admin.
const TICKER_DOC = doc(db, "settings", "ticker");

export default function UrgentTicker({ tasks }) {
  const [customText, setCustomText] = useState("");

  // Dengarkan perubahan pesan ticker secara realtime dari Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      TICKER_DOC,
      (snap) => {
        setCustomText(snap.exists() ? snap.data().customText || "" : "");
      },
      (err) => {
        console.error("Gagal memuat pesan ticker:", err);
      }
    );
    return () => unsub();
  }, []);

  const urgent = tasks
    .map((t) => ({ ...t, u: getUrgency(t.deadline) }))
    .filter((t) => t.u.days !== null && t.u.days <= 3)
    .sort((a, b) => a.u.days - b.u.days);

  // Tentukan apakah ticker ditampilkan:
  // - Jika ada tugas mendesak, selalu tampil
  // - Jika ada custom text, tampil meski tidak ada tugas mendesak
  const hasUrgent = urgent.length > 0;
  const hasCustom = customText.trim().length > 0;

  if (!hasUrgent && !hasCustom) return null;

  // Buat konten running text:
  // - Prioritaskan custom text jika ada
  // - Gabungkan dengan urgent tasks jika ada keduanya
  let parts = [];

  if (hasCustom) {
    parts.push(`⚠ ${customText}`);
  }

  if (hasUrgent) {
    const taskList = urgent.map((t) => `${t.title} · ${t.u.label}`).join("  •  ");
    parts.push(taskList);
  }

  const content = parts.join("      ●      ");

  return (
    <>
      <div className="ticker" role="status">
        <div className="ticker-track">
          <span className="ticker-content">{content}</span>
          <span className="ticker-content" aria-hidden="true">{content}</span>
        </div>
      </div>
    </>
  );
}
