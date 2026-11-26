import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { WEEKDAYS } from "@/lib/data/jadwal"
import type { ChangeRequest, ChangeRequestStatus } from "@/types/jadwal"

/* Format tampilan pengajuan perubahan jadwal (W4) */

/* "2 Des" · "2 Des 2026" */
const dayMonth = (date: Date) => format(date, "d MMM", { locale: localeId })

/* Label "Berlaku": "Seterusnya, mulai 2 Des" · "Sesi Rabu, 25 Nov saja" */
export function formatScope(request: Pick<ChangeRequest, "scope" | "effectiveDate" | "from">) {
  return request.scope === "seterusnya"
    ? `Seterusnya, mulai ${dayMonth(request.effectiveDate)}`
    : `Sesi ${WEEKDAYS[request.from.weekday]}, ${dayMonth(request.effectiveDate)} saja`
}

/* Judul daftar: "Rabu → Kamis, 16.00" · "Rabu, 16.00 → 15.00" */
export function formatChangeTitle(request: ChangeRequest) {
  const from = WEEKDAYS[request.from.weekday]
  const to = WEEKDAYS[request.to.weekday]
  if (request.from.startTime === request.to.startTime) {
    return `${from} → ${to}, ${request.to.startTime}`
  }
  if (from === to) {
    return `${from}, ${request.from.startTime} → ${request.to.startTime}`
  }
  return `${from} ${request.from.startTime} → ${to} ${request.to.startTime}`
}

export const CHANGE_STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  ditinjau_pengelola: "Menunggu persetujuan Pengelola",
  konfirmasi_tutor: "Menunggu konfirmasi tutor",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
}

/* ---------- Jadwal tutor (T5) ---------- */

/*
 * Rentang minggu ringkas untuk pil:
 *   bulan sama → "24–30 Nov 2026"
 *   tahun sama → "29 Nov – 5 Des 2026"
 *   beda tahun → "28 Des 2026 – 3 Jan 2027"
 */
export function formatWeekRange(from: Date, to: Date) {
  const opts = { locale: localeId }
  if (from.getFullYear() !== to.getFullYear()) {
    return `${format(from, "d MMM yyyy", opts)} – ${format(to, "d MMM yyyy", opts)}`
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${format(from, "d MMM", opts)} – ${format(to, "d MMM yyyy", opts)}`
  }
  return `${from.getDate()}–${format(to, "d MMM yyyy", opts)}`
}

/* ["Kamis"] → "Kamis" · ["Kamis", "Minggu"] → "Kamis dan Minggu" · 3+ → "A, B, dan C" */
export function joinDays(days: string[]) {
  if (days.length <= 2) return days.join(" dan ")
  return `${days.slice(0, -1).join(", ")}, dan ${days.at(-1)}`
}
