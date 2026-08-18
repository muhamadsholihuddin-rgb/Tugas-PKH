import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { RHK_CONFIG } from "../data/rhkConfig";
import useIdentity from "../lib/useIdentity";
import { loadLocalEntries, saveLocalEntry, removeLocalEntry } from "../lib/journalLocal";
import StyledSelect from "../components/StyledSelect";
import { toTitleCase } from "../lib/textCase";

const today = () => new Date().toISOString().split("T")[0];

// Warna tag linimasa dirotasi per kategori RHK supaya riwayat harian mudah
// dipindai sekilas tanpa membaca teksnya satu per satu.
const TAG_CLASSES = ["tag-pine", "tag-amber", "tag-navy"];
const DOT_COLORS = ["var(--pine)", "var(--amber)", "var(--navy)"];
function tagStyle(rhkId) {
  const idx = (Number(rhkId) - 1 + 99) % 3;
  return { tagClass: TAG_CLASSES[idx], dotColor: DOT_COLORS[idx] };
}

export default function Jurnal() {
  const { name, ready, saveName } = useIdentity();
  const [nameInput, setNameInput] = useState("");
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [viewDate, setViewDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: today(),
    startTime: "08:00",
    endTime: "08:30",
    rhkId: 1,
    workPlan: RHK_CONFIG[0].options[0],
    desa: "",
    sasaran: "",
    description: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously(auth).catch(console.error);
    });
    return () => unsub();
  }, []);

  // Muat cache lokal dulu supaya langsung tampil walau offline
  useEffect(() => {
    if (!name) return;
    setEntries(loadLocalEntries().filter((e) => e.pendampingName === name));
  }, [name]);

  // Sinkron dari Firestore (menimpa tampilan dengan data server begitu tersedia)
  useEffect(() => {
    if (!user || !name) return;
    const q = query(
      collection(db, "journal"),
      where("pendampingName", "==", name),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Sync jurnal gagal (mode offline?):", err));
    return () => unsub();
  }, [user, name]);

  const dailyEntries = useMemo(
    () => entries.filter((e) => e.date === viewDate),
    [entries, viewDate]
  );

  const rhkOptions = RHK_CONFIG.find((r) => r.id === Number(form.rhkId))?.options || [];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const rhk = RHK_CONFIG.find((r) => r.id === Number(form.rhkId));
    const payload = {
      ...form,
      rhkId: Number(form.rhkId),
      rhkTitle: rhk?.title || "",
      pendampingName: name,
      localId: `${Date.now()}`,
    };

    // Simpan lokal dulu (offline-first)
    saveLocalEntry(payload);
    setEntries((prev) => [payload, ...prev]);

    try {
      await addDoc(collection(db, "journal"), { ...payload, createdAt: serverTimestamp() });
    } catch (err) {
      console.error("Gagal sinkron ke server, tersimpan lokal saja untuk saat ini:", err);
    }
    setForm({ ...form, description: "", desa: "", sasaran: "" });
    setSaving(false);
  };

  const handleDelete = async (entryItem) => {
    if (!confirm("Hapus catatan ini?")) return;
    if (entryItem.localId) removeLocalEntry(entryItem.localId);
    if (entryItem.id) await deleteDoc(doc(db, "journal", entryItem.id));
    setEntries((prev) => prev.filter((e) => e !== entryItem));
  };

  if (!ready) return null;

  if (!name) {
    return (
      <>
        <div className="topbar" style={{ paddingBottom: 18 }}>
          <div className="topbar-inner">
            <div className="brand-row">
              <div className="logo-badge">
                <img src="/logo-kemensos.png" alt="Logo Kementerian Sosial RI" />
              </div>
              <span className="stamp">
                <span className="dot" />
                Jurnal Pendamping
              </span>
            </div>
          </div>
        </div>
        <div className="container" style={{ paddingTop: 28 }}>
          <div className="gate-card">
            <div className="gate-icon">
              <NotebookIcon />
            </div>
            <h1 className="display">Siapa nama kamu?</h1>
            <p>
              Nama ini dipakai untuk memisahkan catatan jurnalmu dari pendamping lain.
              Tersimpan di HP ini saja.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveName(nameInput);
              }}
            >
              <div className="field">
                <label>Nama Lengkap</label>
                <input
                  className="input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
                Mulai
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-row">
            <div className="logo-badge">
              <img src="/logo-kemensos.png" alt="Logo Kementerian Sosial RI" />
            </div>
            <span className="stamp">
              <span className="dot" />
              Jurnal · {name}
            </span>
          </div>

          <div className="hero-row">
            <div className="hero-copy">
              <h1 className="display">Catatan Kegiatan</h1>
              <p>Setiap catatan yang kamu tulis jadi bukti kerja nyata di lapangan.</p>
            </div>
            <div className="hero-illus">
              <WritingIllustration />
            </div>
          </div>

          <nav className="tabs">
            <Link href="/" className="tab">Tugas</Link>
            <Link href="/jurnal" className="tab active">Jurnal Saya</Link>
            <Link href="/admin" className="tab">Admin</Link>
          </nav>
        </div>
      </div>

      <div className="container">
        <form onSubmit={handleSave} className="form-card">
          <div className="form-head">
            <FormHeadIcon />
            <div>
              <h3>Tambah Catatan</h3>
              <span>Isi setelah selesai satu kegiatan lapangan</span>
            </div>
          </div>
          <div className="form-body">
            <div className="field">
              <label>Tanggal</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Jam Mulai</label>
                <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="field">
                <label>Jam Selesai</label>
                <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Kategori RHK</label>
              <StyledSelect
                value={form.rhkId}
                options={RHK_CONFIG.map((r) => ({ value: r.id, label: `RHK ${r.id}: ${toTitleCase(r.title)}` }))}
                onChange={(id) => {
                  const opts = RHK_CONFIG.find((r) => r.id === id)?.options || [];
                  setForm({ ...form, rhkId: id, workPlan: opts[0] });
                }}
              />
            </div>
            <div className="field">
              <label>Kegiatan Spesifik</label>
              <StyledSelect
                value={form.workPlan}
                options={rhkOptions.map((o) => ({ value: o, label: o }))}
                onChange={(val) => setForm({ ...form, workPlan: val })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Desa</label>
                <input className="input" value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} />
              </div>
              <div className="field">
                <label>Sasaran</label>
                <input className="input" value={form.sasaran} onChange={(e) => setForm({ ...form, sasaran: e.target.value })} placeholder="Misal: KPM PKH" />
              </div>
            </div>
            <div className="field">
              <label>Catatan Kegiatan</label>
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Menyimpan…" : "Simpan Catatan"}
            </button>
          </div>
        </form>

        <div className="section-label">
          <span>Riwayat · {dailyEntries.length} catatan</span>
          <input className="input" type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
        </div>

        {dailyEntries.length === 0 && (
          <div className="empty-state">
            <EmptyTicketIcon />
            <p>Belum ada catatan di tanggal ini.</p>
          </div>
        )}

        <div className="timeline">
          {dailyEntries.map((entry, i) => {
            const { tagClass, dotColor } = tagStyle(entry.rhkId);
            const isLast = i === dailyEntries.length - 1;
            return (
              <div className="entry" key={entry.id || entry.localId || i}>
                <div className="entry-time">{entry.startTime}</div>
                <div className="entry-rail">
                  <div className="entry-dot" style={{ color: dotColor }} />
                  {!isLast && <div className="entry-line" />}
                </div>
                <div className="entry-card">
                  <div className="entry-top">
                    <span className={`tag ${tagClass}`}>
                      RHK {entry.rhkId} · {entry.startTime}–{entry.endTime}
                    </span>
                    <button className="btn-del" onClick={() => handleDelete(entry)}>Hapus</button>
                  </div>
                  <h4>{entry.workPlan}</h4>
                  {entry.desa && (
                    <p className="entry-meta">
                      Desa: {entry.desa} {entry.sasaran && `· Sasaran: ${entry.sasaran}`}
                    </p>
                  )}
                  {entry.description && <p className="entry-desc">{entry.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function NotebookIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect x="8" y="6" width="36" height="42" rx="4" fill="#F3E4CE" />
      <rect x="8" y="6" width="8" height="42" rx="4" fill="#C97B2E" />
      <rect x="21" y="16" width="17" height="2.4" rx="1.2" fill="#B98A57" />
      <rect x="21" y="23" width="17" height="2.4" rx="1.2" fill="#B98A57" />
      <rect x="21" y="30" width="11" height="2.4" rx="1.2" fill="#B98A57" />
      <circle cx="38" cy="40" r="10" fill="#1F4D3D" />
      <path d="M33.5 40l3 3 6-6.5" stroke="#EAF4EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WritingIllustration() {
  return (
    <svg width="74" height="82" viewBox="0 0 76 84" fill="none">
      <ellipse cx="38" cy="79" rx="26" ry="4.5" fill="#0F2C22" opacity="0.25" />
      <rect x="14" y="46" width="48" height="30" rx="4" fill="#F3E4CE" transform="rotate(-3 38 61)" />
      <rect x="20" y="52" width="18" height="2" rx="1" fill="#B98A57" transform="rotate(-3 29 53)" />
      <rect x="20" y="58" width="18" height="2" rx="1" fill="#B98A57" transform="rotate(-3 29 59)" />
      <rect x="20" y="64" width="12" height="2" rx="1" fill="#B98A57" transform="rotate(-3 26 65)" />
      <circle cx="38" cy="20" r="11" fill="#E7C79A" />
      <path
        d="M27 18c0-6.5 5-12 11-12s11 5.5 11 12c0-2-2-3.5-3.5-3.5-2 2.5-4.5 3.5-7.5 3.5s-5.5-1-7.5-3.5c-1.5 0-3.5 1.5-3.5 3.5z"
        fill="#1F4D3D"
      />
      <rect x="31" y="27" width="14" height="7" rx="3" fill="#E7C79A" />
      <path d="M32 34c-6 1-11 6-11 12v10c0 2 1.5 3.5 3.5 3.5h5" fill="#3E7D5D" />
      <path d="M56 50l6 4-2.5 6.5-6.5-2z" fill="#C97B2E" />
      <rect x="47" y="52" width="10" height="2.4" rx="1.2" fill="#EAF4EE" transform="rotate(28 52 53)" />
    </svg>
  );
}

function FormHeadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="16" height="16" rx="4" fill="#1F4D3D" />
      <path d="M11 7v8M7 11h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EmptyTicketIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect x="6" y="16" width="40" height="24" rx="6" fill="#DCE9DE" />
      <circle cx="6" cy="28" r="5" fill="#EAF4EE" />
      <circle cx="46" cy="28" r="5" fill="#EAF4EE" />
      <path d="M18 28h16" stroke="#9BB7A2" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
    </svg>
  );
}
