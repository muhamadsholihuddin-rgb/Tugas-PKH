import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getUrgency } from "../lib/urgency";
import useInstallPrompt from "../lib/useInstallPrompt";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("deadline", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="container-inner">
          <div>
            <span className="eyebrow">Pendamping PKH · Kab. Kediri</span>
            <h1 className="display" style={{ fontSize: 26, margin: "4px 0 0" }}>
              Daftar Tugas
            </h1>
          </div>
        </div>
        <nav className="tab-nav" style={{ maxWidth: 640, margin: "12px auto 0" }}>
          <Link href="/" className="active">Tugas</Link>
          <Link href="/jurnal">Jurnal Saya</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>

      <div className="container">
        {canInstall && !isInstalled && (
          <div className="install-banner">
            <div>
              <strong>Pasang di HP kamu</strong>
              <p>Biar dapat notifikasi & akses cepat tanpa buka browser.</p>
            </div>
            <button className="btn btn-amber" onClick={promptInstall}>
              Pasang
            </button>
          </div>
        )}

        {loading && <p className="task-meta">Memuat tugas…</p>}

        {!loading && tasks.length === 0 && (
          <div className="empty-state">
            <p className="display" style={{ fontSize: 20 }}>Belum ada tugas</p>
            <p>Admin belum menambahkan tugas apa pun.</p>
          </div>
        )}

        {tasks.map((task) => {
          const u = getUrgency(task.deadline);
          return (
            <div className="card task-card" key={task.id}>
              <div className="urgency-arc" style={{ background: u.color }}>
                {u.label}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 17, margin: 0 }}>{task.title}</h3>
                {task.target && <p className="task-meta">Target: {task.target}</p>}
                <p className="task-meta mono">
                  Tenggat: {task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-"}
                </p>
                {task.link && (
                  <a href={task.link} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ marginTop: 10 }}>
                    Buka Link Tugas ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
