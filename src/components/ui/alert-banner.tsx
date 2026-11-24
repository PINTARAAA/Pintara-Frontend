import * as React from "react"
import { XIcon } from "lucide-react"

import { StatusIcon, type FeedbackStatus } from "@/components/ui/status-icon"
import { cn } from "@/lib/utils"

/*
 * Alert banner · Figma PINTARA → Components → 06 · Feedback & Overlay
 *
 * Informasi kontekstual yang tetap terlihat di halaman. Latar Semantic/
 * Surface sesuai status, padding 16, gap 12, radius 8, lebar mengikuti
 * wadah. Isi: ikon status 20px · judul (Subtitle/Bold) · deskripsi ·
 * aksi (tautan Primary/Text/primary) · tombol tutup opsional.
 *
 * <AlertBanner status="info" title="Verifikasi akun Anda"
 *   description="Lengkapi informasi akun agar semua fitur dapat digunakan."
 *   action={{ label: "Lengkapi akun", onClick: … }} onDismiss={…} />
 */
const bg: Record<FeedbackStatus, string> = {
  success: "bg-success-subtle",
  info: "bg-info-subtle",
  warning: "bg-warning-subtle",
  error: "bg-error-subtle",
}

function AlertBanner({
  status = "info",
  title,
  description,
  action,
  onDismiss,
  showIcon = true,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  status?: FeedbackStatus
  title: React.ReactNode
  description?: React.ReactNode
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
  showIcon?: boolean
}) {
  return (
    <div
      data-slot="alert-banner"
      data-status={status}
      role={status === "error" || status === "warning" ? "alert" : "status"}
      className={cn(
        "flex w-full items-start gap-ns-m rounded-md p-ns-l text-subtitle leading-normal",
        bg[status],
        className
      )}
      {...props}
    >
      {showIcon && <StatusIcon status={status} />}
      <div className="flex min-w-0 flex-1 flex-col gap-ns-s">
        <p className="font-bold text-grayscale-text-title">{title}</p>
        {description != null && (
          <p className="text-grayscale-text-body">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="-mx-ns-2xs w-fit rounded-sm px-ns-2xs py-ns-s text-primary-text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Tutup"
          onClick={onDismiss}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-grayscale-text-body outline-none hover:bg-neutral-black/5 focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
        >
          <XIcon className="size-5" />
        </button>
      )}
    </div>
  )
}

export { AlertBanner }
