import { useEffect, useState } from "react";
import { getUrgency } from "../lib/urgency";

// Teks berjalan yang muncul otomatis kalau ada tugas dengan sisa waktu H-3
// ke bawah (termasuk yang sudah lewat tenggat). Komponen ini juga menampilkan
// custom alert text jika admin menambahkan pesan darurat tertentu.
export default function UrgentTicker({ tasks }) {
  const [customText, setCustomText] = useState("");
  const [showTicker, setShowTicker] = useState(false);

  // Load custom text dari localStorage saat component mount
  useEffect(() => {
    const saved = localStorage.getItem("tickerCustomText") || "";
    setCustomText(saved);
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
      
      {/* Hidden element untuk admin (diakses via hidden admin UI) */}
      <div id="ticker-control" style={{ display: "none" }} data-custom-text={customText}>
        {/* Data disimpan di element ini supaya admin panel bisa membacanya */}
      </div>
    </>
  );
}
