import type * as React from "react"

import { cn } from "@/lib/styles/cn"

/*
 * Skeleton · placeholder statis sesuai ".Skeleton row" Figma PINTARA:
 * Grayscale/Surface/disabled (garis utama) atau /subtitle (garis sekunder),
 * radius 8. Figma menetapkan skeleton tanpa animasi.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("rounded-md bg-grayscale-surface-disabled", className)}
      {...props}
    />
  )
}

export { Skeleton }
