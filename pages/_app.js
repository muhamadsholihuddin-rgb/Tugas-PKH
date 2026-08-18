import { useEffect } from "react";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Cek pembaruan tiap kali app dibuka/difokuskan.
          registration.update();

          // Kalau ada worker baru yang sudah siap, aktifkan & reload otomatis
          // sekali saja, supaya user langsung dapat versi terbaru tanpa
          // harus uninstall/clear cache manual.
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => {
          console.error("Gagal mendaftarkan service worker:", err);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}
