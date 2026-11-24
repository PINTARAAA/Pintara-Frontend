"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { InfoIcon, Trash2Icon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/*
 * Confirmation modal · Figma PINTARA → Components → 06 · Feedback & Overlay
 *
 * Lebar 480px, padding 24, gap 24, radius 12, border Grayscale/Border/default.
 * Struktur: Header (ikon tone 40px + tombol tutup) · Message (judul
 * Headline/Bold + deskripsi) · Actions (Batal = secondary, Konfirmasi =
 * primary; tone destructive = tombol merah).
 * Tone: default (Info, Primary) · warning (Alert Triangle) · destructive (Trash).
 *
 * Paling praktis: <ConfirmDialog tone="destructive" title="Hapus dokumen?" … />.
 * Primitive di bawah tetap tersedia untuk susunan khusus.
 */
type Tone = "default" | "warning" | "destructive"

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-neutral-black/30 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-ns-2xl rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-2xl text-subtitle text-grayscale-text-body shadow-lg duration-100 outline-none sm:max-w-120",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/* Baris atas: ikon tone di kiri, tombol tutup di kanan */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex items-start justify-between gap-ns-m", className)}
      {...props}
    />
  )
}

const mediaTone: Record<Tone, string> = {
  default: "bg-primary-surface-subtitle text-primary-surface-default",
  warning: "bg-warning-subtle text-warning",
  destructive: "bg-error-subtle text-error",
}

const toneIcon: Record<Tone, React.ReactNode> = {
  default: <InfoIcon />,
  warning: <TriangleAlertIcon />,
  destructive: <Trash2Icon />,
}

/* Ikon status 24px dalam lingkaran 40px; isi otomatis sesuai tone */
function AlertDialogMedia({
  tone = "default",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: Tone }) {
  return (
    <div
      data-slot="alert-dialog-media"
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-6",
        mediaTone[tone],
        className
      )}
      {...props}
    >
      {children ?? toneIcon[tone]}
    </div>
  )
}

/* Tombol tutup (ikon X 20px) */
function AlertDialogDismiss({
  className,
  ...props
}: AlertDialogPrimitive.Close.Props) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-dismiss"
      aria-label="Tutup"
      className={cn(
        "ml-auto flex size-6 shrink-0 items-center justify-center rounded-sm text-grayscale-text-body outline-none hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter",
        className
      )}
      {...props}
    >
      <XIcon className="size-5" />
    </AlertDialogPrimitive.Close>
  )
}

/* Pembungkus judul + deskripsi ("Message"), gap 8 */
function AlertDialogMessage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-message"
      className={cn("flex flex-col gap-ns-s", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-ns-m sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-headline font-bold text-grayscale-text-title", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-subtitle leading-normal text-grayscale-text-body *:[a]:text-primary-text-primary *:[a]:underline *:[a]:underline-offset-3",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  variant = "secondary",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

/*
 * ConfirmDialog · Confirmation modal siap pakai.
 *
 * <ConfirmDialog tone="destructive" title="Hapus dokumen?"
 *   description="Dokumen akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
 *   confirmLabel="Hapus dokumen" onConfirm={hapus}
 *   trigger={<Button variant="destructive">Hapus</Button>} />
 */
function ConfirmDialog({
  tone = "default",
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  onConfirm,
  trigger,
  open,
  onOpenChange,
  showIcon = true,
  showCancel = true,
  showDismiss = true,
  confirmDisabled,
}: {
  tone?: Tone
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /* Dialog ditutup setelah onConfirm selesai (mendukung Promise) */
  onConfirm: () => void | Promise<void>
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showIcon?: boolean
  showCancel?: boolean
  showDismiss?: boolean
  confirmDisabled?: boolean
}) {
  const [innerOpen, setInnerOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const isOpen = open ?? innerOpen
  const setOpen = (next: boolean) => {
    if (open === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }

  const handleConfirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        {(showIcon || showDismiss) && (
          <AlertDialogHeader>
            {showIcon && <AlertDialogMedia tone={tone} />}
            {showDismiss && <AlertDialogDismiss />}
          </AlertDialogHeader>
        )}
        <AlertDialogMessage>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description != null && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogMessage>
        <AlertDialogFooter>
          {showCancel && <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>}
          <AlertDialogAction
            variant={tone === "destructive" ? "destructive" : "primary"}
            onClick={handleConfirm}
            disabled={confirmDisabled || pending}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogDismiss,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogMessage,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  ConfirmDialog,
}
