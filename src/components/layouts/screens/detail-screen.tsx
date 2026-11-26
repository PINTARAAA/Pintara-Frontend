import * as React from "react"
import { useNavigate } from "react-router"

import { PageHeader } from "@/components/ui/page-header"
import { TopAppBar } from "@/components/ui/top-app-bar"
import { cn } from "@/lib/styles"

/*
 * DetailScreen · kerangka layar turunan (detail, formulir, konfirmasi).
 * Pasang `handle: { hideBottomNav: true }` pada route-nya.
 *
 * Mobile (sesuai Figma): Top app bar "Detail" (kembali + judul + aksi)
 *   menempel di atas; konten padding 16 (bawah 24), gap 16; bilah aksi
 *   menempel di bawah (latar putih, garis atas Grayscale/Border/disabled,
 *   padding 12/16/16, gap 12, tombol mengisi lebar).
 * Desktop (≥ lg): konten rata kiri dengan padding 40 (`--gutter`), lebar
 *   maks. sesuai `desktopWidth` (default 768px / 48rem) agar baris teks &
 *   formulir tetap nyaman dibaca; sisa ruang masuk ke padding kanan
 *   (`--gutter-end`).
 *   desktopHeader="bar"  : Top app bar tetap dipakai; bilah aksi tidak lagi
 *     menempel, tombolnya rata kanan di akhir konten dengan lebar sesuai label.
 *   desktopHeader="page" : Figma "… (Desktop)" — halaman putih, Page header
 *     (tautan kembali `backLabel` + judul H3) menggantikan Top app bar,
 *     padding atas 32, gap 24, tidak menempel. Tombol `footer` tampil di Page header (desktopActions="header")
 *     atau di akhir konten di bawah garis pemisah (desktopActions="footer").
 *
 * <DetailScreen title="Detail Jadwal"
 *   footer={<Button variant="secondary">Ajukan Perubahan Jadwal</Button>}>
 *   …
 * </DetailScreen>
 */
const WIDTHS = {
  default: "lg:[--content-max:48rem]",
  /* Formulir desktop (Figma: 720px) */
  form: "lg:[--content-max:45rem]",
  /* Detail multi-kolom, selebar TabScreen */
  wide: "lg:[--content-max:90rem]",
}

function DetailScreen({
  title,
  onBack,
  backLabel = "Kembali",
  action,
  subheader,
  footer,
  surface = "muted",
  desktopHeader = "bar",
  desktopActions = "footer",
  desktopWidth = "default",
  className,
  children,
}: {
  title: React.ReactNode
  /* Default: kembali ke halaman sebelumnya */
  onBack?: () => void
  /* Label tautan kembali di Page header desktop, mis. "Pendaftaran" */
  backLabel?: string
  action?: React.ReactNode
  /* Area menempel di bawah top app bar, mis. Progress stepper formulir */
  subheader?: React.ReactNode
  /* Isi bilah aksi, biasanya satu atau dua Button */
  footer?: React.ReactNode
  /* muted = latar abu (detail), default = latar putih (formulir) */
  surface?: "muted" | "default"
  /* bar = Top app bar juga di desktop, page = Page header desktop */
  desktopHeader?: "bar" | "page"
  /* Khusus desktopHeader="page": letak tombol `footer` di desktop */
  desktopActions?: "footer" | "header"
  desktopWidth?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  const navigate = useNavigate()
  const back = onBack ?? (() => navigate(-1))
  const page = desktopHeader === "page"

  return (
    <div
      className={cn(
        "flex flex-1 flex-col [--gutter:var(--spacing-ns-l)] [--gutter-end:var(--spacing-ns-l)] lg:[--gutter:var(--spacing-ns-4xl)] lg:[--gutter-end:max(var(--spacing-ns-4xl),calc(100%-var(--content-max)-var(--spacing-ns-4xl)))]",
        WIDTHS[desktopWidth],
        surface === "default"
          ? "bg-grayscale-surface-default"
          : "bg-grayscale-surface-subtitle",
        page && "lg:bg-grayscale-surface-default"
      )}
    >
      <div className={cn("sticky top-0 z-10", page && "lg:static")}>
        {page && (
          <PageHeader
            className="hidden pl-(--gutter) pr-(--gutter-end) pt-ns-3xl lg:flex"
            title={title}
            back={{ label: backLabel, onClick: back }}
            actions={
              (action != null ||
                (footer != null && desktopActions === "header")) && (
                <>
                  {action}
                  {desktopActions === "header" && footer}
                </>
              )
            }
          />
        )}
        <TopAppBar
          variant="detail"
          title={title}
          onBack={back}
          action={action}
          className={cn(
            "pl-(--gutter) pr-(--gutter-end) lg:py-ns-l",
            page && "lg:hidden"
          )}
        />
        {subheader != null && (
          <div
            className={cn(
              "border-b border-grayscale-border-disabled bg-grayscale-surface-default pl-(--gutter) pr-(--gutter-end) py-ns-m",
              page && "lg:border-b-0 lg:pt-ns-2xl lg:pb-0"
            )}
          >
            {subheader}
          </div>
        )}
      </div>

      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-l pl-(--gutter) pr-(--gutter-end) pt-ns-l pb-ns-2xl lg:flex-none lg:pt-ns-2xl",
          page && "lg:gap-ns-2xl",
          className
        )}
      >
        {children}
        {page && footer != null && desktopActions === "footer" && (
          <div className="hidden justify-end gap-ns-m border-t border-grayscale-border-default pt-ns-2xl lg:flex">
            {footer}
          </div>
        )}
      </main>

      {footer != null && (
        <div
          data-slot="action-bar"
          className={cn(
            "sticky bottom-0 z-10 flex gap-ns-m border-t border-grayscale-border-disabled bg-grayscale-surface-default pl-(--gutter) pr-(--gutter-end) pt-ns-m pb-[max(var(--spacing-ns-l),env(safe-area-inset-bottom))] *:flex-1",
            page
              ? "lg:hidden"
              : "lg:static lg:justify-end lg:border-t-0 lg:bg-transparent lg:pt-0 lg:pb-ns-3xl lg:*:flex-none"
          )}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

export { DetailScreen }
