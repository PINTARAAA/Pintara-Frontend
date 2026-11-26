import { differenceInCalendarDays, format, isToday } from "date-fns"
import { id as localeId } from "date-fns/locale"

import type { TutorSession } from "@/types/presensi"
import { formatTimeRange, formatWeekdayDate } from "@/lib/format"

/* "IPA · Dimas Pratama" */
export const sessionTitle = (s: Pick<TutorSession, "subject" | "student">) =>
  `${s.subject} · ${s.student.name}`

/* "Senin, 23 Nov 2026" */
export const formatLongDate = (date: Date) =>
  format(date, "EEEE, d MMM yyyy", { locale: localeId })

/*
 * Keterangan sesi yang perlu diisi:
 *   kemarin/sebelumnya → "Senin, 23 Nov · 16.00–17.30 · terlewat 1 hari"
 *   hari ini           → "Hari ini · 16.00–17.30"
 */
export function formatToFill(session: TutorSession, now = new Date()) {
  const range = formatTimeRange(session.start, session.end)
  if (isToday(session.start)) return `Hari ini · ${range}`
  const late = differenceInCalendarDays(now, session.start)
  return `${formatWeekdayDate(session.start)} · ${range} · terlewat ${late} hari`
}

