// Menentukan tampilan "busur urgensi" tiap kartu tugas berdasarkan jarak ke deadline.
export function getUrgency(deadlineStr) {
  if (!deadlineStr) return { color: "#9AA69E", label: "-", days: null };

  const now = new Date();
  const deadline = new Date(deadlineStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.ceil((deadline.setHours(23, 59, 59, 999) - now) / msPerDay);

  if (days < 0) return { color: "#C1502E", label: "LEWAT", days };
  if (days === 0) return { color: "#C1502E", label: "HARI H", days };
  if (days === 1) return { color: "#E2A63B", label: "H-1", days };
  if (days <= 3) return { color: "#E2A63B", label: `H-${days}`, days };
  return { color: "#145C4B", label: `H-${days}`, days };
}
