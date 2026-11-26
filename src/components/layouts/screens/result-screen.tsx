import * as React from "react"
import { CircleCheckIcon, CircleXIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/styles"

function ResultScreen({
  title,
  highlight,
  description,
  status = "success",
  align = "center",
  footer,
  footerVariant = "plain",
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
  children?: React.ReactNode
}) {
  return (
    <div className="bg-grayscale-surface-default flex flex-1 flex-col">
      <main
        className={cn(
          "gap-ns-2xl px-ns-2xl pt-ns-3xl pb-ns-2xl mx-auto flex w-full max-w-120 flex-1 flex-col items-center",
          align === "center" && "justify-center"
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
          <div className="gap-ns-s px-ns-2xl pt-ns-l mx-auto flex w-full max-w-120 flex-col pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ))}
    </div>
  )
}

export { ResultScreen }
