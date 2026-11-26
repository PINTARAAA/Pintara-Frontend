import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns"
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

/* "Selamat pagi," dst. sesuai jam (pagi < 11, siang < 15, sore < 18) */
export function formatGreeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 11) return "Selamat pagi,"
  if (hour < 15) return "Selamat siang,"
  if (hour < 18) return "Selamat sore,"
  return "Selamat malam,"
}

/* "Hari ini" · "Besok" · "Kemarin" · selain itu "Rabu, 25 Nov" */
export function formatRelativeDay(date: Date, now = new Date()) {
  if (isToday(date)) return "Hari ini"
  if (isTomorrow(date)) return "Besok"
  if (isYesterday(date)) return "Kemarin"
  return format(date, isSameYear(date, now) ? "EEEE, d MMM" : "EEEE, d MMM yyyy", {
    locale: localeId,
  })
}

/* Sisa waktu singkat: "30 menit lagi" · "5 jam lagi" · "Besok" · "Sedang berlangsung" */
export function formatTimeUntil(date: Date, now = new Date()) {
  const minutes = differenceInMinutes(date, now)
  if (minutes <= 0) return "Sedang berlangsung"
  if (minutes < 60) return `${minutes} menit lagi`
  if (isToday(date)) return `${differenceInHours(date, now)} jam lagi`
  return formatRelativeDay(date, now)
}

/* "Rabu, 25 Nov · 16.00–17.30" */
export function formatSessionTime(start: Date, end: Date) {
  return `${format(start, "EEEE, d MMM", { locale: localeId })} · ${format(start, "HH.mm")}–${format(end, "HH.mm")}`
}

/* "16.00–17.30" */
export function formatTimeRange(start: Date, end: Date) {
  return `${format(start, "HH.mm")}–${format(end, "HH.mm")}`
}

/* "Jumat, 27 Nov" */
export function formatWeekdayDate(date: Date) {
  return format(date, "EEEE, d MMM", { locale: localeId })
}

/* "Jum, 14 Nov" — untuk daftar yang padat */
export function formatShortWeekdayDate(date: Date) {
  return format(date, "EEE, d MMM", { locale: localeId })
}

/* "10 Des" — tanggal singkat tanpa tahun */
export function formatDayMonth(date: Date) {
  return format(date, "d MMM", { locale: localeId })
}

/* "hari ini" · "kemarin" · "3 hari lalu" */
export function formatDaysAgo(date: Date, now = new Date()) {
  const days = differenceInCalendarDays(now, date)
  if (days <= 0) return "hari ini"
  if (days === 1) return "kemarin"
  return `${days} hari lalu`
}

/* "2026-11" → 1 November 2026; nilai tidak valid → undefined (bulan berjalan) */
export function parseMonth(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return undefined
  const [y, m] = value.split("-").map(Number)
  return new Date(y, m - 1, 1)
}
