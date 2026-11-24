/*
 * Format Rupiah sesuai penulisan di Figma PINTARA (tanpa spasi setelah "Rp").
 */
const full = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const compact = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
})

const stripSpace = (value: string) => value.replace(/^Rp\s+/, "Rp")

/* 600000 → "Rp600.000" */
export function formatRupiah(amount: number) {
  return stripSpace(full.format(amount))
}

/* 38200000 → "Rp38,2 jt" — untuk ringkasan angka besar */
export function formatRupiahCompact(amount: number) {
  return stripSpace(compact.format(amount))
}
