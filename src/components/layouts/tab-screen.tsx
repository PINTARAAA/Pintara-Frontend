import * as React from "react"

import { TopAppBar } from "@/components/ui/top-app-bar"
import { cn } from "@/lib/styles/cn"

/*
 * TabScreen · kerangka layar tab (dipakai di dalam BottomNavLayout).
 * Figma: Top app bar "Main" menempel di atas, konten berlatar
 * Grayscale/Surface/subtitle dengan padding 16 (bawah 24) dan jarak antar
 * bagian 24px.
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
    <div className="flex flex-1 flex-col">
      <TopAppBar
        title={title}
        subtitle={subtitle}
        action={action}
        className="sticky top-0 z-10"
      />
      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-2xl px-ns-l pt-ns-l pb-ns-2xl",
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}

export { TabScreen }
