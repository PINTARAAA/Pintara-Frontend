import * as React from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/styles"

/*
 * Timeline · Figma PINTARA → Components → 05 · Data Display → Timeline item
 *
 * Langkah proses berurutan (mis. status pendaftaran). Marker 24px:
 *   done     : Primary/Surface/default + centang putih, garis biru
 *   current  : Primary/Surface/subtitle + titik Primary
 *   upcoming : Grayscale/Surface/disabled + titik abu, teks redup
 *   rejected : Semantic/Error-Subtle + silang merah
 * Garis penghubung 2px otomatis disembunyikan pada item terakhir.
 */
function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="timeline"
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
}

type TimelineState = "done" | "current" | "upcoming" | "rejected"

const markerClass: Record<TimelineState, string> = {
  done: "bg-primary-surface-default text-primary-text-label",
  current: "bg-primary-surface-subtitle",
  upcoming: "bg-grayscale-surface-disabled",
  rejected: "bg-error-subtle text-grayscale-text-negative",
}

const stateLabel: Record<TimelineState, string> = {
  done: "Selesai",
  current: "Sedang berlangsung",
  upcoming: "Belum dimulai",
  rejected: "Ditolak",
}

function TimelineItem({
  state,
  title,
  description,
  timestamp,
  className,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  state: TimelineState
  title: React.ReactNode
  description?: React.ReactNode
  timestamp?: React.ReactNode
}) {
  const muted = state === "upcoming"
  return (
    <li
      data-slot="timeline-item"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn("group/timeline flex gap-ns-m", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-ns-2xs self-stretch">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5",
            markerClass[state]
          )}
        >
          {state === "done" && <CheckIcon strokeWidth={3} aria-hidden="true" />}
          {state === "rejected" && <XIcon strokeWidth={3} aria-hidden="true" />}
          {state === "current" && (
            <span className="size-2 rounded-full bg-primary-surface-default" />
          )}
          {state === "upcoming" && (
            <span className="size-2 rounded-full bg-grayscale-border-default" />
          )}
          <span className="sr-only">{stateLabel[state]}</span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "min-h-px w-0.5 flex-1 rounded-full group-last/timeline:hidden",
            state === "done"
              ? "bg-primary-surface-default"
              : "bg-grayscale-border-disabled"
          )}
        />
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-ns-2xs pt-ns-2xs pb-ns-xl leading-normal group-last/timeline:pb-0",
          muted && "*:text-grayscale-text-disabled!"
        )}
      >
        <p className="text-subtitle font-bold text-grayscale-text-title">
          {title}
        </p>
        {description != null && (
          <p className="text-caption text-grayscale-text-body">{description}</p>
        )}
        {timestamp != null && (
          <p className="text-footnote text-grayscale-text-caption">
            {timestamp}
          </p>
        )}
      </div>
    </li>
  )
}

export { Timeline, TimelineItem }
