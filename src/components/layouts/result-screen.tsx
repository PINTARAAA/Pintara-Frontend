import * as React from "react"
import { CircleCheckIcon, CircleXIcon } from "lucide-react"

import { cn } from "@/lib/styles/cn"

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
  /* success = ikon centang hijau; error = ikon silang merah (mis. Pembayaran gagal) */
  status?: "success" | "error"
  align?: "center" | "top"
  footer?: React.ReactNode
  footerVariant?: "plain" | "bar"
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col bg-grayscale-surface-default">
      <main
        className={cn(
          "mx-auto flex w-full max-w-120 flex-1 flex-col items-center gap-ns-2xl px-ns-2xl pt-ns-3xl pb-ns-2xl",
          align === "center" && "justify-center"
        )}
      >
        <div
          className={cn(
            "flex size-22 shrink-0 items-center justify-center rounded-full",
            status === "error" ? "bg-error-subtle" : "bg-success-subtle"
          )}
        >
          {status === "error" ? (
            <CircleXIcon
              aria-hidden="true"
              strokeWidth={2}
              className="size-11 text-grayscale-text-body"
            />
          ) : (
            <CircleCheckIcon
              aria-hidden="true"
              strokeWidth={2}
              className="size-11 text-grayscale-text-body"
            />
          )}
        </div>
        <div className="flex flex-col gap-ns-s text-center">
          <h1 className="text-h4 font-bold text-grayscale-text-title">{title}</h1>
          {highlight != null && (
            <p className="text-h3 font-bold text-grayscale-text-title">
              {highlight}
            </p>
          )}
          {description != null && (
            <p className="text-subtitle leading-normal text-grayscale-text-body">
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
            className="sticky bottom-0 z-10 border-t border-grayscale-border-disabled bg-grayscale-surface-default px-ns-l pt-ns-m pb-[max(var(--spacing-ns-l),env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto flex w-full max-w-120 gap-ns-m *:flex-1">
              {footer}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-120 flex-col gap-ns-s px-ns-2xl pt-ns-l pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ))}
    </div>
  )
}

export { ResultScreen }
