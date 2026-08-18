// Mengubah teks ALL CAPS (mis. judul kategori RHK) jadi Title Case yang lebih
// enak dibaca, tapi tetap menjaga singkatan resmi (PKH, KPM, dst) tetap kapital.
const ACRONYMS = new Set(["PKH", "P2K2", "KPM", "PPSE", "ASN", "PPPK", "TLHP", "SDM"]);

export function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => {
      const match = word.match(/^(\(?)([A-Za-z0-9/&-]+)([).,;:]*)$/);
      if (!match) return word;
      const [, prefix, core, suffix] = match;
      if (ACRONYMS.has(core.toUpperCase())) {
        return `${prefix}${core.toUpperCase()}${suffix}`;
      }
      const lower = core.toLowerCase();
      const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
      return `${prefix}${capitalized}${suffix}`;
    })
    .join(" ");
}
