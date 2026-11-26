import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import type { PengelolaRegistration, RejectReason } from "@/types/verifikasi"
import { formatDaysAgo } from "@/lib/format"

/* Format tampilan Verifikasi Pendaftaran (P2) */

/* "REG-2026-0115 · Dikirim 22 Nov, 19.40 (2 hari lalu)" */
export function formatSubmitted(r: PengelolaRegistration) {
  const when = format(r.submittedAt, "d MMM, HH.mm", { locale: localeId })
  return `${r.number} · Dikirim ${when} (${formatDaysAgo(r.submittedAt)})`
}

/* ["Senin", "Kamis"] + "19.00" → "Senin & Kamis, 19.00" */
export function formatRequestedSchedule(needs: PengelolaRegistration["needs"]) {
  const { days } = needs
  const list =
    days.length <= 2
      ? days.join(" & ")
      : `${days.slice(0, -1).join(", ")} & ${days.at(-1)}`
  return `${list}, ${needs.startTime}`
}

/* Templat pesan untuk wali per alasan penolakan (boleh diubah sebelum dikirim) */
export function rejectionTemplate(
  reason: RejectReason,
  r: PengelolaRegistration
) {
  const to = r.parent.salutation
  switch (reason) {
    case "di_luar_jangkauan":
      return `Mohon maaf, alamat les belum termasuk area layanan kami. Kami akan mengabari ${to} bila layanan sudah menjangkau area tersebut.`
    case "tutor_belum_tersedia":
      return `Saat ini belum ada tutor ${r.needs.subjects[0]} untuk jenjang ${r.student.level}. Kami akan menghubungi ${to} jika sudah tersedia.`
    case "data_tidak_valid":
      return `Data pendaftaran belum dapat kami verifikasi. Mohon ${to} mendaftar ulang dengan data siswa yang lengkap dan benar.`
    case "lainnya":
      return ""
  }
}

/* "Perum Griya Utama Blok C-7, Bangkalan" → "Perum Griya Utama, Bangkalan" */
export function formatShortAddress(address: string) {
  const [street, ...rest] = address.split(",")
  const short = street.replace(/\s+(Blok|No\.)\s.*$/i, "")
  return [short, ...rest].join(",")
}
