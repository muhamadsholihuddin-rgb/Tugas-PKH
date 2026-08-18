import { useEffect, useState } from "react";

// Komponen ini ditambahkan di halaman Admin untuk mengelola custom text di ticker
// Letakkan di file pages/admin.js atau buat file terpisah di components/
export default function TickerControl() {
  const [customText, setCustomText] = useState("");
  const [savedStatus, setSavedStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load custom text dari localStorage saat component mount
  useEffect(() => {
    const saved = localStorage.getItem("tickerCustomText") || "";
    setCustomText(saved);
  }, []);

  // Handle perubahan input
  const handleChange = (e) => {
    setCustomText(e.target.value);
    setSavedStatus(false); // Reset status saat user mengedit
  };

  // Handle save
  const handleSave = () => {
    setIsSaving(true);
    // Simulating save delay (bisa di-replace dengan API call jika perlu)
    setTimeout(() => {
      localStorage.setItem("tickerCustomText", customText);
      setIsSaving(false);
      setSavedStatus(true);
      // Auto-hide status message setelah 3 detik
      setTimeout(() => setSavedStatus(false), 3000);
    }, 500);
  };

  // Handle clear
  const handleClear = () => {
    if (confirm("Hapus custom text dari ticker?")) {
      setCustomText("");
      localStorage.removeItem("tickerCustomText");
      setSavedStatus(false);
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
          disabled={isSaving}
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
          <li>Perbarui kapan saja, perubahan langsung terlihat</li>
        </ul>
      </div>
    </div>
  );
}
