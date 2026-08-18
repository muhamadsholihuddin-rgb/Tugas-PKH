import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { db } from "../lib/firebase";

// Komponen ini ditambahkan di halaman Admin untuk mengelola custom text di ticker.
// Custom text disimpan di Firestore (dokumen settings/ticker), BUKAN localStorage,
// supaya pesan yang disimpan admin di satu device langsung terlihat oleh semua
// user di device/browser manapun yang membuka halaman Tugas.
const TICKER_DOC = doc(db, "settings", "ticker");

export default function TickerControl() {
  const [customText, setCustomText] = useState("");
  const [savedStatus, setSavedStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load custom text dari Firestore saat component mount
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(TICKER_DOC);
        setCustomText(snap.exists() ? snap.data().customText || "" : "");
      } catch (err) {
        console.error("Gagal memuat pesan ticker:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Handle perubahan input
  const handleChange = (e) => {
    setCustomText(e.target.value);
    setSavedStatus(false); // Reset status saat user mengedit
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(TICKER_DOC, { customText }, { merge: true });
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan pesan ticker:", err);
      alert("Gagal menyimpan pesan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle clear
  const handleClear = async () => {
    if (confirm("Hapus custom text dari ticker?")) {
      try {
        await setDoc(TICKER_DOC, { customText: deleteField() }, { merge: true });
        setCustomText("");
        setSavedStatus(false);
      } catch (err) {
        console.error("Gagal menghapus pesan ticker:", err);
        alert("Gagal menghapus pesan. Coba lagi.");
      }
    }
  };

  return (
    <div className="ticker-control-modal">
      <h3>⚠ Kelola Pesan Ticker</h3>
      <p>
        Tambahkan pesan darurat atau penting yang ingin ditampilkan di running text di atas. 
        Pesan akan otomatis muncul di semua user.
      </p>

      <div className="field">
        <label htmlFor="custom-ticker-text">Pesan Ticker (Opsional)</label>
        <textarea
          id="custom-ticker-text"
          className="input"
          placeholder="Contoh: Tutup laporan minggu ini sebelum Jumat jam 5 sore"
          value={customText}
          onChange={handleChange}
          disabled={isLoading}
        />
        <div className="ticker-info">
          💡 Tinggalkan kosong jika tidak ada pesan darurat. 
          Text akan digabungkan dengan daftar tugas yang mendekati deadline.
        </div>
      </div>

      {/* Preview jika ada custom text */}
      {customText.trim().length > 0 && (
        <div className="field">
          <label>Preview Ticker</label>
          <div className="ticker-preview">
            ⚠ {customText} ●
          </div>
          <div className="ticker-info">
            Ukuran text: <strong>18px bold</strong> • Durasi scroll: 28 detik
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="btn-row">
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Menyimpan..." : "💾 Simpan Pesan"}
        </button>
        
        {customText.trim().length > 0 && (
          <button 
            className="btn btn-ghost"
            onClick={handleClear}
          >
            🗑 Hapus
          </button>
        )}
      </div>

      {/* Status message */}
      {savedStatus && (
        <div style={{
          marginTop: "12px",
          padding: "12px 14px",
          background: "#E8F5E9",
          border: "1px solid #4CAF50",
          borderRadius: "6px",
          fontSize: "12.5px",
          color: "#2E7D32",
          fontWeight: 500
        }}>
          ✓ Pesan tersimpan & langsung muncul di running text
        </div>
      )}

      {/* Tips section */}
      <div style={{
        marginTop: "18px",
        paddingTop: "16px",
        borderTop: "1px solid var(--line)"
      }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--ink-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          margin: "0 0 10px"
        }}>
          ℹ Tips Penulisan Pesan
        </p>
        <ul style={{
          fontSize: "12.5px",
          color: "var(--ink-muted)",
          margin: "0",
          paddingLeft: "16px",
          lineHeight: "1.6"
        }}>
          <li>Gunakan kalimat singkat & jelas (max 80 karakter)</li>
          <li>Hindari karakter spesial yang bisa menyebabkan error</li>
          <li>Pesan akan muncul di depan list tugas mendesak</li>
          <li>Perbarui kapan saja, perubahan langsung terlihat di semua device</li>
        </ul>
      </div>
    </div>
  );
}
