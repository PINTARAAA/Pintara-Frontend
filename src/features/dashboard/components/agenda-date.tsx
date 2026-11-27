import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { cn } from "@/lib/styles"

/*
 * Kotak tanggal agenda 64×72 (Beranda desktop W1 · T1): hari singkat
 * kapital ("RAB") di atas tanggal H4. Latar diatur lewat `className`.
 */
function AgendaDate({ date, className }: { date: Date; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-18 w-16 shrink-0 flex-col items-center justify-center rounded-(--comp-radius-md) font-bold",
        className
      )}
    >
      <span className="text-caption leading-normal text-primary-text-primary uppercase">
        {format(date, "EEE", { locale: localeId })}
      </span>
      <span className="text-h4 text-grayscale-text-title">
        {format(date, "d")}
      </span>
    </span>
  )
}

export { AgendaDate }
