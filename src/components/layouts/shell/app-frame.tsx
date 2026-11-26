import * as React from "react"

import { cn } from "@/lib/styles"

/*
 * AppFrame · bingkai terluar semua layar.
 *
 * Mobile & tablet (< lg): kolom mobile di tengah (maks. 480px), sesuai
 *   desain Figma PINTARA yang mobile-first (375 × 812).
 * Desktop (≥ lg, 1024px): lebar penuh; navigasi pindah ke Sidebar
 *   (lihat AppShell).
 */
function AppFrame({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="min-h-dvh bg-grayscale-surface-disabled">
      <div
        data-slot="app-frame"
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-120 flex-col bg-grayscale-surface-subtitle sm:shadow-lg",
          "lg:max-w-none lg:shadow-none",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

export { AppFrame }
