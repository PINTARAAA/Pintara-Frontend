import type * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/*
 * Toaster · wadah antrean toast (Sonner). Pasang sekali di root app, lalu
 * panggil `toast.success(...)` dkk. dari "@/components/ui/toast-api". Tampilan tiap toast
 * dirender oleh <Toast> (src/components/ui/toast.tsx) sesuai Figma PINTARA,
 * jadi gaya bawaan Sonner dimatikan (unstyled) dan lebarnya 480px.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group"
      style={{ "--width": "480px" } as React.CSSProperties}
      toastOptions={{ unstyled: true, classNames: { toast: "w-full" } }}
      {...props}
    />
  )
}

export { Toaster }
