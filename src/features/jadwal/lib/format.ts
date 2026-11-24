import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import {
  WEEKDAYS,
  type ChangeRequest,
  type ChangeRequestStatus,
} from "@/features/jadwal/api/jadwal"

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
