import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Progress stepper · Figma PINTARA → Components → 04 · Navigation
 *
 * Nama langkah (Subtitle/Bold) + "Langkah n dari N" (Caption, Grayscale/Text/
 * caption), lalu bar bersegmen: tinggi 4px, jarak 4px, bulat penuh. Segmen
 * yang sudah dicapai = Primary/Surface/default, sisanya Grayscale/Surface/
 * disabled.
 */
function ProgressStepper({
  step,
  totalSteps = 4,
  stepName,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /* Langkah aktif, dimulai dari 1 */
  step: number
  totalSteps?: number
  stepName: React.ReactNode
}) {
  const current = Math.min(Math.max(step, 1), totalSteps)

  return (
    <div
      data-slot="progress-stepper"
      className={cn("flex w-full flex-col gap-ns-s", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-ns-s leading-normal whitespace-nowrap">
        <p className="truncate text-subtitle font-bold text-grayscale-text-title">
          {stepName}
        </p>
        <p className="shrink-0 text-caption text-grayscale-text-caption">
          Langkah {current} dari {totalSteps}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={current}
        aria-valuetext={`Langkah ${current} dari ${totalSteps}`}
        className="flex w-full gap-ns-2xs"
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            data-complete={i < current || undefined}
            className="h-1 min-w-px flex-1 rounded-full bg-grayscale-surface-disabled data-complete:bg-primary-surface-default"
          />
        ))}
      </div>
    </div>
  )
}

export { ProgressStepper }
