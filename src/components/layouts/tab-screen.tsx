import * as React from "react"

import { TopAppBar } from "@/components/ui/top-app-bar"
import { cn } from "@/lib/styles/cn"

/*
 * TabScreen · kerangka layar tab (di dalam AppShell).
 *
 * Mobile (sesuai Figma): Top app bar "Main" menempel di atas, konten berlatar
 *   Grayscale/Surface/subtitle, padding 16 (bawah 24), jarak antar bagian 24.
 * Desktop (≥ lg): padding samping 32 dan lebar konten maks. 1152px (72rem).
 *   Top app bar dan konten memakai `--gutter` yang sama agar rata kiri.
 *   Susun bagian konten dalam grid (mis. `lg:grid-cols-2`) bila perlu.
 *
 * <TabScreen subtitle="Selamat pagi," title="Ibu Sari Wulandari"
 *   action={<TopAppBarButton label="Notifikasi" dot><BellIcon /></TopAppBarButton>}>
 *   …
 * </TabScreen>
 */
function TabScreen({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col [--gutter:var(--spacing-ns-l)] lg:[--gutter:max(var(--spacing-ns-3xl),calc((100%-72rem)/2))]">
      <TopAppBar
        title={title}
        subtitle={subtitle}
        action={action}
        className="sticky top-0 z-10 px-(--gutter) lg:py-ns-l"
      />
      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-2xl px-(--gutter) pt-ns-l pb-ns-2xl lg:pt-ns-2xl lg:pb-ns-3xl",
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}

export { TabScreen }
