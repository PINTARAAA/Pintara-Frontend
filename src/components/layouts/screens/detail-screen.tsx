import * as React from "react"
import { useNavigate } from "react-router"

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
 *   maks. 768px (48rem) agar baris teks & formulir tetap nyaman dibaca;
 *   sisa ruang masuk ke padding kanan (`--gutter-end`); bilah aksi tidak lagi menempel, tombolnya rata kanan
 *   di akhir konten dengan lebar sesuai label.
 *
 * <DetailScreen title="Detail Jadwal"
 *   footer={<Button variant="secondary">Ajukan Perubahan Jadwal</Button>}>
 *   …
 * </DetailScreen>
 */
function DetailScreen({
  title,
  onBack,
  action,
  subheader,
  footer,
  surface = "muted",
  className,
  children,
}: {
  title: React.ReactNode
  /* Default: kembali ke halaman sebelumnya */
  onBack?: () => void
  action?: React.ReactNode
  /* Area menempel di bawah top app bar, mis. Progress stepper formulir */
  subheader?: React.ReactNode
  /* Isi bilah aksi, biasanya satu atau dua Button */
  footer?: React.ReactNode
  /* muted = latar abu (detail), default = latar putih (formulir) */
  surface?: "muted" | "default"
  className?: string
  children: React.ReactNode
}) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        "flex flex-1 flex-col [--gutter:var(--spacing-ns-l)] [--gutter-end:var(--spacing-ns-l)] lg:[--gutter:var(--spacing-ns-4xl)] lg:[--gutter-end:max(var(--spacing-ns-4xl),calc(100%-48rem-var(--spacing-ns-4xl)))]",
        surface === "default"
          ? "bg-grayscale-surface-default"
          : "bg-grayscale-surface-subtitle"
      )}
    >
      <div className="sticky top-0 z-10">
        <TopAppBar
          variant="detail"
          title={title}
          onBack={onBack ?? (() => navigate(-1))}
          action={action}
          className="pl-(--gutter) pr-(--gutter-end) lg:py-ns-l"
        />
        {subheader != null && (
          <div className="border-b border-grayscale-border-disabled bg-grayscale-surface-default pl-(--gutter) pr-(--gutter-end) py-ns-m">
            {subheader}
          </div>
        )}
      </div>

      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-l pl-(--gutter) pr-(--gutter-end) pt-ns-l pb-ns-2xl lg:flex-none lg:pt-ns-2xl",
          className
        )}
      >
        {children}
      </main>

      {footer != null && (
        <div
          data-slot="action-bar"
          className={cn(
            "sticky bottom-0 z-10 flex gap-ns-m border-t border-grayscale-border-disabled bg-grayscale-surface-default pl-(--gutter) pr-(--gutter-end) pt-ns-m pb-[max(var(--spacing-ns-l),env(safe-area-inset-bottom))] *:flex-1",
            "lg:static lg:justify-end lg:border-t-0 lg:bg-transparent lg:pt-0 lg:pb-ns-3xl lg:*:flex-none"
          )}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

export { DetailScreen }
