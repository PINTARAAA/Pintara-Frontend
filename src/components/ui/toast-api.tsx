import * as React from "react"
import { toast as sonner, type ExternalToast } from "sonner"

import { Toast } from "@/components/ui/toast"
import type { FeedbackStatus } from "@/components/ui/status-icon"

/*
 * API untuk memunculkan toast PINTARA. Sonner mengurus antrean, posisi,
 * durasi dan swipe; tampilannya dirender oleh <Toast> (./toast.tsx) sesuai
 * Figma. Pasang <Toaster /> (./sonner.tsx) sekali di root app.
 *
 *   import { toast } from "@/components/ui/toast-api"
 *
 *   toast.success("Data berhasil disimpan", {
 *     description: "Perubahan sudah tersimpan.",
 *     action: { label: "Lihat data", onClick: () => navigate("/data") },
 *   })
 *   toast.error("Data gagal disimpan", { type: "snackbar",
 *     action: { label: "Coba lagi", onClick: retry } })
 */
type ToastOptions = {
  description?: React.ReactNode
  type?: "toast" | "snackbar"
  action?: { label: string; onClick: () => void }
  /* Tampilkan tombol tutup (default true) */
  dismissible?: boolean
} & Pick<ExternalToast, "id" | "duration" | "onDismiss" | "onAutoClose">

function show(status: FeedbackStatus, title: React.ReactNode, options: ToastOptions = {}) {
  const { description, type, action, dismissible = true, ...rest } = options
  return sonner.custom(
    (id) => (
      <Toast
        status={status}
        type={type}
        title={title}
        description={description}
        action={
          action && {
            label: action.label,
            onClick: () => {
              action.onClick()
              sonner.dismiss(id)
            },
          }
        }
        onDismiss={dismissible ? () => sonner.dismiss(id) : undefined}
      />
    ),
    rest
  )
}

export const toast = {
  success: (title: React.ReactNode, options?: ToastOptions) => show("success", title, options),
  info: (title: React.ReactNode, options?: ToastOptions) => show("info", title, options),
  warning: (title: React.ReactNode, options?: ToastOptions) => show("warning", title, options),
  error: (title: React.ReactNode, options?: ToastOptions) => show("error", title, options),
  dismiss: sonner.dismiss,
}
