import * as React from "react"

import { TopAppBar } from "@/components/ui/top-app-bar"
import { cn } from "@/lib/styles"

/*
 * TabScreen · kerangka layar tab (di dalam AppShell).
 *
 * Mobile (sesuai Figma): Top app bar "Main" menempel di atas, konten berlatar
 *   Grayscale/Surface/subtitle, padding 16 (bawah 24), jarak antar bagian 24.
 * Desktop (≥ lg, Figma "… (Desktop)"): konten rata kiri setelah sidebar
 *   dengan padding 40 (`--gutter`), lebar maks. 1440px (90rem); sisa ruang
 *   masuk ke padding kanan (`--gutter-end`). Top app bar memakai nilai sama.
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
  subheader,
  className,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  /* Area menempel di bawah top app bar, mis. Tabs ("Tabs wrap" di Figma) */
  subheader?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col [--gutter:var(--spacing-ns-l)] [--gutter-end:var(--spacing-ns-l)] lg:[--gutter:var(--spacing-ns-4xl)] lg:[--gutter-end:max(var(--spacing-ns-4xl),calc(100%-90rem-var(--spacing-ns-4xl)))]">
      <div className="sticky top-0 z-10">
        <TopAppBar
          title={title}
          subtitle={subtitle}
          action={action}
          className="pl-(--gutter) pr-(--gutter-end) lg:py-ns-l"
        />
        {subheader != null && (
          <div className="bg-grayscale-surface-default pl-(--gutter) pr-(--gutter-end) pt-ns-s">
            {subheader}
          </div>
        )}
      </div>
      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-2xl pl-(--gutter) pr-(--gutter-end) pt-ns-l pb-ns-2xl lg:pt-ns-2xl lg:pb-ns-3xl",
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}

export { TabScreen }
