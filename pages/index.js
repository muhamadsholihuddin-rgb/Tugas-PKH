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
        <div className="topbar-inner">
          <div className="brand-row">
            <div className="logo-badge">
              <img src="/logo-kemensos.png" alt="Logo Kementerian Sosial RI" />
            </div>
            <span className="stamp">
              <span className="dot" />
              Pendamping PKH · Kab. Kediri
            </span>
          </div>

          <div className="hero-row">
            <div className="hero-copy">
              <h1 className="display">Daftar Tugas</h1>
              <p>Semangat kerja hari ini — setiap tugas yang selesai berarti satu keluarga terlayani.</p>
            </div>
            <div className="hero-illus">
              <FieldWorkerIllustration />
            </div>
          </div>

          <nav className="tabs">
            <Link href="/" className="tab active">Tugas</Link>
            <Link href="/jurnal" className="tab">Jurnal Saya</Link>
            <Link href="/admin" className="tab">Admin</Link>
          </nav>
        </div>
      </div>

      <div className="container">
        {canInstall && !isInstalled && (
          <div className="install-banner">
            <InstallIcon />
            <div className="install-copy">
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
            <EmptyTicketIcon />
            <p className="display" style={{ fontSize: 19, marginBottom: 4 }}>Belum ada tugas</p>
            <p>Admin belum menambahkan tugas apa pun.</p>
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="section-label">
            <span>{tasks.length} tugas aktif</span>
            <span>Urut tenggat ↑</span>
          </div>
        )}

        {tasks.map((task, i) => {
          const u = getUrgency(task.deadline);
          const nomor = `TGS·${String(i + 1).padStart(3, "0")}`;
          return (
            <div className="ticket" key={task.id}>
              <div className="ticket-stub" style={{ background: u.color }}>
                <span className="no">{nomor}</span>
                <span className="badge">{u.label}</span>
              </div>
              <div className="perforation" />
              <div className="ticket-body">
                <h3>{task.title}</h3>
                {task.target && <p className="task-meta">Target: {task.target}</p>}
                <p className="task-meta mono">
                  Tenggat:{" "}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </p>
                {task.link && (
                  <a href={task.link} target="_blank" rel="noreferrer" className="link-btn">
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

/* Ilustrasi flat: pendamping lapangan membawa tas & catatan — menonjolkan
   kesan kerja sungguh-sungguh di lapangan, bukan sekadar dekorasi. */
function FieldWorkerIllustration() {
  return (
    <svg width="84" height="90" viewBox="0 0 86 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="43" cy="86" rx="30" ry="5" fill="#0F2C22" opacity="0.25" />
      <path d="M27 46c0-6 4-10 9-10h14c5 0 9 4 9 10v22c0 3-2 5-5 5H32c-3 0-5-2-5-5V46z" fill="#F3E4CE" />
      <circle cx="43" cy="22" r="12" fill="#E7C79A" />
      <path
        d="M31 20c0-7 5-13 12-13s12 6 12 13c0-2-2-4-4-4-2 3-5 4-8 4s-6-1-8-4c-2 0-4 2-4 4z"
        fill="#1F4D3D"
      />
      <rect x="35" y="30" width="16" height="8" rx="3" fill="#E7C79A" />
      <path d="M20 52c-3 2-5 6-4 10l3 12c1 3 4 5 7 4l2-1-4-19c-1-4-2-6-4-6z" fill="#C97B2E" />
      <rect x="10" y="58" width="20" height="16" rx="4" fill="#D2521E" transform="rotate(-8 20 66)" />
      <rect x="52" y="52" width="15" height="20" rx="3" fill="#3E7D5D" />
      <rect x="55" y="56" width="9" height="2" rx="1" fill="#EAF4EE" />
      <rect x="55" y="60" width="9" height="2" rx="1" fill="#EAF4EE" />
      <rect x="55" y="64" width="6" height="2" rx="1" fill="#EAF4EE" />
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="9" y="2" width="16" height="30" rx="4" fill="#1F4D3D" />
      <rect x="11" y="6" width="12" height="20" rx="1" fill="#EAF4EE" />
      <circle cx="17" cy="28.5" r="1.4" fill="#EAF4EE" />
      <circle cx="26" cy="10" r="7" fill="#C97B2E" />
      <path d="M26 6.5v7M22.5 10h7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
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
