const KEY = "jurnal_entries_cache";

// Cache lokal supaya jurnal tetap bisa dilihat/diisi walau sinyal lemah;
// sinkron ke Firestore terjadi di background saat online.
export function loadLocalEntries() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLocalEntry(entry) {
  const entries = loadLocalEntries();
  entries.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(entries));
  return entries;
}

export function removeLocalEntry(localId) {
  const entries = loadLocalEntries().filter((e) => e.localId !== localId);
  localStorage.setItem(KEY, JSON.stringify(entries));
  return entries;
}
