import * as React from "react"

import { PageHeader } from "@/components/ui/page-header"
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
 *   desktopHeader="page" : Top app bar diganti Page header (judul H3, tanpa
 *     aksi — notifikasi sudah ada di sidebar), halaman putih, header dan
 *     subheader tidak menempel; padding atas 32, subheader 24 di bawahnya.
 *     `subtitle` ikut tampil di atas judul (mis. sapaan Beranda Wali).
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
  desktopHeader = "bar",
  desktopHeaderActions,
  className,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  /* Area menempel di bawah top app bar, mis. Tabs ("Tabs wrap" di Figma) */
  subheader?: React.ReactNode
  /* bar = Top app bar juga di desktop, page = Page header desktop */
  desktopHeader?: "bar" | "page"
  /*
   * Khusus desktopHeader="page": aksi di kanan Page header, hanya tampil
   * di desktop, mis. pil periode + tombol halaman
   */
  desktopHeaderActions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const page = desktopHeader === "page"

  return (
    <div
      className={cn(
        "flex flex-1 flex-col [--gutter:var(--spacing-ns-l)] [--gutter-end:var(--spacing-ns-l)] lg:[--gutter:var(--spacing-ns-4xl)] lg:[--gutter-end:max(var(--spacing-ns-4xl),calc(100%-90rem-var(--spacing-ns-4xl)))]",
        page && "lg:bg-grayscale-surface-default"
      )}
    >
      <div className={cn("sticky top-0 z-10", page && "lg:static")}>
        {page && (
          <PageHeader
            className="hidden pl-(--gutter) pr-(--gutter-end) pt-ns-3xl lg:flex"
            title={title}
            subtitle={subtitle}
            actions={desktopHeaderActions}
          />
        )}
        <TopAppBar
          title={title}
          subtitle={subtitle}
          action={action}
          className={cn(
            "pl-(--gutter) pr-(--gutter-end) lg:py-ns-l",
            page && "lg:hidden"
          )}
        />
        {subheader != null && (
          <div
            className={cn(
              "bg-grayscale-surface-default pl-(--gutter) pr-(--gutter-end) pt-ns-s",
              page && "lg:pt-ns-2xl"
            )}
          >
            {subheader}
          </div>
        )}
      </div>
      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-2xl pl-(--gutter) pr-(--gutter-end) pt-ns-l pb-ns-2xl lg:pt-ns-2xl lg:pb-ns-3xl",
          page && "lg:pt-ns-3xl",
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}

export { TabScreen }
