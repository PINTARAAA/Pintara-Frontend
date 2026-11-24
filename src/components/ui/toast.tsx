import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusIcon, type FeedbackStatus } from "@/components/ui/status-icon"
import { cn } from "@/lib/styles/cn"

/*
 * Toast / Snackbar · Figma PINTARA → Components → 06 · Feedback & Overlay
 *
 * Lebar 480px, padding 16, gap 12, radius 8, tinggi mengikuti isi.
 *   type="toast"    : latar putih + border Grayscale/Border/default,
 *                     judul (Subtitle/Bold) + deskripsi.
 *   type="snackbar" : latar Semantic/Surface sesuai status, judul saja.
 * Elemen: ikon status 20px · pesan · aksi (Button tertiary sm) · tutup.
 *
 * Komponen ini hanya tampilan; untuk memunculkannya pakai `toast` dari
 * "@/components/ui/toast-api" (di atas Sonner) dan pasang <Toaster /> sekali di root app.
 */
const snackbarBg: Record<FeedbackStatus, string> = {
  success: "bg-success-subtle",
  info: "bg-info-subtle",
  warning: "bg-warning-subtle",
  error: "bg-error-subtle",
}

type ToastProps = Omit<React.ComponentProps<"div">, "title"> & {
  status: FeedbackStatus
  type?: "toast" | "snackbar"
  title: React.ReactNode
  /* Hanya ditampilkan pada type="toast" */
  description?: React.ReactNode
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
  showIcon?: boolean
}

function Toast({
  status,
  type = "toast",
  title,
  description,
  action,
  onDismiss,
  showIcon = true,
  className,
  ...props
}: ToastProps) {
  return (
    <div
      data-slot="toast"
      data-type={type}
      data-status={status}
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "flex w-full max-w-120 items-center gap-ns-m rounded-md p-ns-l text-subtitle leading-normal shadow-md",
        type === "toast"
          ? "border border-grayscale-border-default bg-grayscale-surface-default"
          : snackbarBg[status],
        className
      )}
      {...props}
    >
      {showIcon && <StatusIcon status={status} />}
      <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs">
        <p className="font-bold text-grayscale-text-title">{title}</p>
        {type === "toast" && description != null && (
          <p className="text-grayscale-text-body">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant="tertiary"
          size="sm"
          className="shrink-0 text-primary-text-primary"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
      {onDismiss && (
        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={onDismiss}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-grayscale-text-body outline-none hover:bg-neutral-black/5 focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
        >
          <XIcon className="size-5" />
        </button>
      )}
    </div>
  )
}

export { Toast }
