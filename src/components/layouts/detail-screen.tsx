import * as React from "react"
import { useNavigate } from "react-router"

import { TopAppBar } from "@/components/ui/top-app-bar"
import { cn } from "@/lib/styles/cn"

/*
 * DetailScreen · kerangka layar turunan (detail, formulir, konfirmasi),
 * tampil tanpa bottom navigation.
 * Figma: Top app bar "Detail" (tombol kembali + judul + aksi opsional)
 * menempel di atas; konten padding 16 (bawah 24), gap 16; bilah aksi
 * opsional menempel di bawah (latar putih, garis atas Grayscale/Border/
 * disabled, padding 12/16/16, gap 12, tombol mengisi lebar).
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
  /* Isi bilah aksi bawah, biasanya satu atau dua Button */
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
        "flex flex-1 flex-col",
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
        />
        {subheader != null && (
          <div className="border-b border-grayscale-border-disabled bg-grayscale-surface-default px-ns-l py-ns-m">
            {subheader}
          </div>
        )}
      </div>

      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-l px-ns-l pt-ns-l pb-ns-2xl",
          className
        )}
      >
        {children}
      </main>

      {footer != null && (
        <div className="sticky bottom-0 z-10 flex gap-ns-m border-t border-grayscale-border-disabled bg-grayscale-surface-default px-ns-l pt-ns-m pb-[max(var(--spacing-ns-l),env(safe-area-inset-bottom))] *:flex-1">
          {footer}
        </div>
      )}
    </div>
  )
}

export { DetailScreen }
