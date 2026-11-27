import * as React from "react"
import { CircleCheckIcon, CircleXIcon, TriangleAlertIcon } from "lucide-react"

import { PageHeader } from "@/components/ui/page-header"
import { cn } from "@/lib/styles"

/*
 * ResultScreen · layar hasil (berhasil / gagal / peringatan) tanpa navigasi.
 *
 * Mobile: ikon status, judul, deskripsi dan isi di tengah (maks. 480px);
 *   tombol `footer` ditumpuk di bawah (plain) atau di bilah aksi (bar).
 * Desktop (≥ lg) dengan `pageTitle` (Figma "… (Desktop)"): Page header
 *   berisi `pageTitle` di kiri atas; hasil (maks. 560px) dan tombol plain
 *   berada di tengah halaman, tombol berdampingan dengan lebar sesuai label
 *   (urutan dibalik: tombol utama di kanan). Tanpa `pageTitle` tampilan
 *   desktop sama seperti sebelumnya.
 */

function ResultScreen({
  title,
  highlight,
  description,
  status = "success",
  align = "center",
  footer,
  footerVariant = "plain",
  pageTitle,
  children,
}: {
  title: React.ReactNode
  /* Nilai besar di bawah judul (H3/Bold), mis. nominal "Rp450.000" */
  highlight?: React.ReactNode
  description?: React.ReactNode
  /*
   * success = ikon centang hijau; error = ikon silang merah (mis. Pembayaran
   * gagal); warning = segitiga peringatan kuning (mis. Penolakan tercatat)
   */
  status?: "success" | "error" | "warning"
  align?: "center" | "top"
  footer?: React.ReactNode
  footerVariant?: "plain" | "bar"
  /* Judul Page header desktop, mis. "Cocokkan Tutor" */
  pageTitle?: React.ReactNode
  children?: React.ReactNode
}) {
  const page = pageTitle != null

  return (
    <div className="bg-grayscale-surface-default flex flex-1 flex-col">
      {page && (
        <PageHeader
          className="px-ns-4xl pt-ns-3xl hidden lg:flex"
          title={pageTitle}
        />
      )}
      <div
        className={cn(
          "flex flex-1 flex-col",
          page && "lg:pb-ns-4xl lg:justify-center"
        )}
      >
        <main
          className={cn(
            "gap-ns-2xl px-ns-2xl pt-ns-3xl pb-ns-2xl mx-auto flex w-full max-w-120 flex-1 flex-col items-center",
            align === "center" && "justify-center",
            page && "lg:max-w-140 lg:flex-none lg:px-0 lg:pt-0"
          )}
        >
          <div
            className={cn(
              "flex size-22 shrink-0 items-center justify-center rounded-full",
              status === "error"
                ? "bg-error-subtle"
                : status === "warning"
                  ? "bg-warning-subtle"
                  : "bg-success-subtle"
            )}
          >
            {status === "warning" ? (
              <TriangleAlertIcon
                aria-hidden="true"
                strokeWidth={2}
                className="text-grayscale-text-body size-11"
              />
            ) : status === "error" ? (
              <CircleXIcon
                aria-hidden="true"
                strokeWidth={2}
                className="text-grayscale-text-body size-11"
              />
            ) : (
              <CircleCheckIcon
                aria-hidden="true"
                strokeWidth={2}
                className="text-grayscale-text-body size-11"
              />
            )}
          </div>
          <div className="gap-ns-s flex flex-col text-center">
            <h1 className="text-h4 text-grayscale-text-title font-bold">
              {title}
            </h1>
            {highlight != null && (
              <p className="text-h3 text-grayscale-text-title font-bold">
                {highlight}
              </p>
            )}
            {description != null && (
              <p className="text-subtitle text-grayscale-text-body leading-normal">
                {description}
              </p>
            )}
          </div>
          {children}
        </main>

        {footer != null &&
          (footerVariant === "bar" ? (
            <div
              data-slot="action-bar"
              className="border-grayscale-border-disabled bg-grayscale-surface-default px-ns-l pt-ns-m sticky bottom-0 z-10 border-t pb-[max(var(--spacing-ns-l),env(safe-area-inset-bottom))]"
            >
              <div className="gap-ns-m mx-auto flex w-full max-w-120 *:flex-1">
                {footer}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "gap-ns-s px-ns-2xl pt-ns-l mx-auto flex w-full max-w-120 flex-col pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))]",
                page &&
                  "lg:gap-ns-2xl lg:max-w-140 lg:flex-row-reverse lg:justify-center lg:px-0 lg:pt-0 lg:pb-0"
              )}
            >
              {footer}
            </div>
          ))}
      </div>
    </div>
  )
}

/*
 * Tombol utama layar hasil memakai size="lg" (64px) di mobile; di desktop
 * Figma memakai ukuran medium (48px). Tambahkan ke className tombol itu.
 */
const RESULT_BUTTON_DESKTOP =
  "lg:min-h-12 lg:rounded-(--comp-radius-md) lg:px-(--comp-px-md) lg:py-(--comp-py-md) lg:text-subtitle"

export { ResultScreen, RESULT_BUTTON_DESKTOP }
