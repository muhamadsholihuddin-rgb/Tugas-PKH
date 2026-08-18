import { useEffect, useRef, useState } from "react";

// Pengganti <select> bawaan HTML. Dipakai karena picker native (terutama di
// Chrome Android) memakai font & ukuran sistem yang tidak bisa diatur lewat
// CSS — hasilnya teks besar & polos yang tidak sesuai desain aplikasi.
// Dengan komponen ini, daftar pilihan dirender sendiri oleh React sehingga
// font, warna, dan ukurannya konsisten dengan seluruh aplikasi.
export default function StyledSelect({ value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="styled-select" ref={wrapperRef}>
      <button
        type="button"
        className="styled-select-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="styled-select-value">
          {selected ? selected.label : placeholder || "Pilih…"}
        </span>
        <span className={`styled-select-chevron${open ? " open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="styled-select-menu" role="listbox">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              role="option"
              aria-selected={String(o.value) === String(value)}
              className={`styled-select-option${String(o.value) === String(value) ? " selected" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
