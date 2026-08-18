import { useEffect, useState } from "react";

const KEY = "pendamping_nama";

// Identitas pendamping cukup nama yang diketik bebas sekali di awal (tanpa login/password),
// dipakai sebagai pemisah data jurnal antar pendamping.
export default function useIdentity() {
  const [name, setName] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    setName(saved);
    setReady(true);
  }, []);

  const saveName = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    localStorage.setItem(KEY, trimmed);
    setName(trimmed);
  };

  const resetName = () => {
    localStorage.removeItem(KEY);
    setName(null);
  };

  return { name, ready, saveName, resetName };
}
