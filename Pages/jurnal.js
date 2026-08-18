import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { RHK_CONFIG } from "../data/rhkConfig";
import useIdentity from "../lib/useIdentity";
import { loadLocalEntries, saveLocalEntry, removeLocalEntry } from "../lib/journalLocal";

const today = () => new Date().toISOString().split("T")[0];

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
      <div className="container" style={{ paddingTop: 60 }}>
        <span className="eyebrow">Jurnal Pendamping</span>
        <h1 className="display" style={{ marginTop: 6 }}>Siapa nama kamu?</h1>
        <p className="task-meta" style={{ marginBottom: 18 }}>
          Nama ini dipakai untuk memisahkan catatan jurnalmu dari pendamping lain. Tersimpan di HP ini saja.
        </p>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            saveName(nameInput);
          }}
        >
          <div className="field">
            <label>Nama Lengkap</label>
            <input className="input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Mulai</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="container-inner">
          <div>
            <span className="eyebrow">Jurnal · {name}</span>
            <h1 className="display" style={{ fontSize: 26, margin: "4px 0 0" }}>Catatan Kegiatan</h1>
          </div>
        </div>
        <nav className="tab-nav" style={{ maxWidth: 640, margin: "12px auto 0" }}>
          <Link href="/">Tugas</Link>
          <Link href="/jurnal" className="active">Jurnal Saya</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>

      <div className="container">
        <form onSubmit={handleSave} className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Tambah Catatan</h3>
          <div className="field">
            <label>Tanggal</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Jam Mulai</label>
              <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Jam Selesai</label>
              <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Kategori RHK</label>
            <select
              value={form.rhkId}
              onChange={(e) => {
                const id = Number(e.target.value);
                const opts = RHK_CONFIG.find((r) => r.id === id)?.options || [];
                setForm({ ...form, rhkId: id, workPlan: opts[0] });
              }}
            >
              {RHK_CONFIG.map((r) => (
                <option key={r.id} value={r.id}>RHK {r.id}: {r.title}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Kegiatan Spesifik</label>
            <select value={form.workPlan} onChange={(e) => setForm({ ...form, workPlan: e.target.value })}>
              {rhkOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Desa</label>
            <input className="input" value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} />
          </div>
          <div className="field">
            <label>Sasaran</label>
            <input className="input" value={form.sasaran} onChange={(e) => setForm({ ...form, sasaran: e.target.value })} placeholder="Misal: KPM PKH" />
          </div>
          <div className="field">
            <label>Catatan Kegiatan</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
            {saving ? "Menyimpan…" : "Simpan Catatan"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className="display" style={{ margin: 0, fontSize: 18 }}>Riwayat</h3>
          <input className="input" type="date" style={{ width: 160 }} value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
        </div>

        {dailyEntries.length === 0 && (
          <div className="empty-state">
            <p>Belum ada catatan di tanggal ini.</p>
          </div>
        )}

        {dailyEntries.map((entry, i) => (
          <div className="card" key={entry.id || entry.localId || i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="eyebrow">RHK {entry.rhkId} · {entry.startTime}–{entry.endTime}</span>
              <button className="btn btn-ghost" style={{ padding: "4px 12px" }} onClick={() => handleDelete(entry)}>Hapus</button>
            </div>
            <h4 style={{ margin: "6px 0 4px" }}>{entry.workPlan}</h4>
            {entry.desa && <p className="task-meta">Desa: {entry.desa} {entry.sasaran && `· Sasaran: ${entry.sasaran}`}</p>}
            {entry.description && <p style={{ fontSize: 14, marginTop: 8 }}>{entry.description}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
