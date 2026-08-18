// Naikkan angka versi ini SETIAP KALI kamu deploy perubahan, supaya HP
// pengguna otomatis buang cache lama dan ambil versi baru.
const CACHE_NAME = "tugas-pkh-v2";
const CORE_ASSETS = ["/", "/jurnal", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategi: network-first untuk halaman (HTML/navigasi) supaya user SELALU
// dapat versi terbaru saat online, cache cuma dipakai sebagai fallback saat
// offline. Aset statis (gambar, ikon, dll) tetap cache-first agar tetap cepat.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Untuk permintaan halaman (navigasi), coba jaringan dulu.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Untuk aset lain (JS, CSS, gambar, dll), cache-first seperti biasa.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// Menampilkan notifikasi push yang dikirim server saat tugas mendekati deadline
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Pengingat Tugas";
  const options = {
    body: data.body || "Ada tugas yang mendekati tenggat.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
