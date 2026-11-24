import { format, isSameMonth, isSameYear } from "date-fns"
import { id as localeId } from "date-fns/locale"

/*
 * Format tampilan berbahasa Indonesia, sesuai penulisan di Figma PINTARA.
 * Fungsi murni (tanpa React), dipakai komponen maupun fitur.
 */

/* "19 Nov 2026" — isi field tanggal, sel tabel */
export function formatDate(date: Date) {
  return format(date, "d MMM yyyy", { locale: localeId })
}

/* "19 November 2026" — ringkasan, teks panjang */
export function formatDateLong(date: Date) {
  return format(date, "d MMMM yyyy", { locale: localeId })
}

/* "24 Nov 2026, 10.15" — stempel waktu (Timeline, riwayat) */
export function formatDateTime(date: Date) {
  return format(date, "d MMM yyyy, HH.mm", { locale: localeId })
}

/*
 * Rentang tanggal ringkas:
 *   bulan sama  → "19–25 November 2026"
 *   tahun sama  → "24 November – 3 Desember 2026"
 *   beda tahun  → "28 Desember 2026 – 2 Januari 2027"
 *   tanpa akhir → "19 November 2026 – …"
 */
export function formatDateRange(from: Date, to?: Date) {
  if (!to) return `${formatDateLong(from)} – …`
  if (isSameMonth(from, to)) {
    return from.getDate() === to.getDate()
      ? formatDateLong(from)
      : `${from.getDate()}–${formatDateLong(to)}`
  }
  if (isSameYear(from, to)) {
    return `${format(from, "d MMMM", { locale: localeId })} – ${formatDateLong(to)}`
  }
  return `${formatDateLong(from)} – ${formatDateLong(to)}`
}
