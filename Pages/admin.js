import { useEffect, useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", link: "", target: "", deadline: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), orderBy("deadline", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError("Email atau kata sandi salah.");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!form.title || !form.deadline) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "tasks"), {
        ...form,
        notifiedH1: false,
        notifiedH0: false,
        createdAt: serverTimestamp(),
      });
      setForm({ title: "", link: "", target: "", deadline: "" });
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan tugas.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus tugas ini?")) return;
    await deleteDoc(doc(db, "tasks", id));
  };

  if (checking) return null;

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <span className="eyebrow">Admin</span>
        <h1 className="display" style={{ marginTop: 6 }}>Masuk</h1>
        <form onSubmit={handleLogin} className="card" style={{ marginTop: 20 }}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Kata Sandi</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {loginError && <p style={{ color: "#C1502E", fontSize: 13 }}>{loginError}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Masuk</button>
        </form>
        <p style={{ marginTop: 16 }}><Link href="/">← Kembali ke daftar tugas</Link></p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="display" style={{ margin: "4px 0 0" }}>Kelola Tugas</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => signOut(auth)}>Keluar</button>
      </div>

      <form onSubmit={handleAddTask} className="card" style={{ marginTop: 20 }}>
        <div className="field">
          <label>Judul Tugas</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="field">
          <label>Link Tugas</label>
          <input className="input" type="url" placeholder="https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        </div>
        <div className="field">
          <label>Target</label>
          <input className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="Misal: seluruh KPM Kec. Gurah" />
        </div>
        <div className="field">
          <label>Deadline</label>
          <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
          {saving ? "Menyimpan…" : "Tambah Tugas"}
        </button>
      </form>

      <div style={{ marginTop: 28 }}>
        {tasks.map((t) => (
          <div className="card" key={t.id} style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>{t.title}</h3>
              <p className="task-meta mono">{t.deadline}</p>
            </div>
            <button className="btn btn-ghost" onClick={() => handleDelete(t.id)}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}
