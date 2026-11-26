import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { daysUntilDue, type Bill } from "@/features/tagihan/api"
import { formatDate, formatDayMonth } from "@/lib/format/date"

/* "November 2026" */
export const formatPeriod = (date: Date) =>
  format(date, "MMMM yyyy", { locale: localeId })

/* "November" */
export const formatMonth = (date: Date) =>
  format(date, "MMMM", { locale: localeId })

/*
 * Keterangan jatuh tempo:
 *   short → "Jatuh tempo 10 Des · 16 hari lagi" (daftar)
 *   long  → "Jatuh tempo 10 Des 2026 · 16 hari lagi" (detail)
 */
export function formatDue(bill: Pick<Bill, "dueDate">, variant: "short" | "long") {
  const days = daysUntilDue(bill)
  const date =
    variant === "short" ? formatDayMonth(bill.dueDate) : formatDate(bill.dueDate)
  if (days < 0) return `Lewat jatuh tempo ${-days} hari (${formatDate(bill.dueDate)})`
  if (days === 0) return `Jatuh tempo hari ini (${date})`
  return `Jatuh tempo ${date} · ${days} hari lagi`
}
