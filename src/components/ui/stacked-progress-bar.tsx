import * as React from "react"

import type { StatusTone } from "@/lib/status"
import { cn } from "@/lib/utils"

/*
 * Stacked progress bar · Figma PINTARA → Components → 05 · Data Display
 *
 * Satu bar utuh (tinggi 8px, bulat penuh, track Grayscale/Surface/disabled)
 * yang menunjukkan komposisi dari satu total, tanpa jeda antarsegmen.
 * Lebar segmen sebanding nilainya; segmen bernilai > 0 minimal 4px; sisa yang
 * belum terisi tampil sebagai warna track. Sertakan legenda (label + jumlah)
 * agar informasi tidak bergantung pada warna saja.
 *
 * <StackedProgressBar total={30} segments={[
 *   { label: "Hadir", value: 18, tone: "success" },
 *   { label: "Izin", value: 5, tone: "warning" },
 *   { label: "Alpa", value: 3, tone: "error" },
 * ]} showLegend />
 */
type Segment = {
  label: string
  value: number
  tone?: StatusTone | "primary"
}

const segmentColor: Record<NonNullable<Segment["tone"]>, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  neutral: "bg-neutral-700",
  primary: "bg-primary-surface-default",
}

function StackedProgressBar({
  segments,
  total,
  showLegend,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  segments: Segment[]
  /* Total nilai; default = jumlah semua segmen (bar terisi penuh) */
  total?: number
  showLegend?: boolean
}) {
  const sum = segments.reduce((acc, s) => acc + Math.max(s.value, 0), 0)
  const max = Math.max(total ?? sum, sum, 1)
  const summary = segments.map((s) => `${s.label} ${s.value}`).join(", ")

  return (
    <div
      data-slot="stacked-progress-bar"
      className={cn("flex w-full flex-col gap-ns-m", className)}
      {...props}
    >
      <div
        role="img"
        aria-label={`${summary} dari total ${max}`}
        className="flex h-2 w-full overflow-hidden rounded-full bg-grayscale-surface-disabled"
      >
        {segments.map((s) =>
          s.value > 0 ? (
            <span
              key={s.label}
              className={cn("h-full min-w-1 shrink-0", segmentColor[s.tone ?? "primary"])}
              style={{ width: `${(s.value / max) * 100}%` }}
            />
          ) : null
        )}
      </div>
      {showLegend && (
        <ul className="flex flex-wrap gap-x-ns-l gap-y-ns-s text-caption text-grayscale-text-body">
          {segments.map((s) => (
            <li key={s.label} className="inline-flex items-center gap-ns-xs">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", segmentColor[s.tone ?? "primary"])}
              />
              {s.label}
              <span className="font-bold">{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { StackedProgressBar }
