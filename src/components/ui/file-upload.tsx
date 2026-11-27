import * as React from "react"
import { CheckIcon, FileTextIcon, UploadIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/styles"

/*
 * File upload · Figma PINTARA → Components → 02 · Form Controls → File upload
 *
 * Satu ukuran (Medium). State:
 *   default   : dropzone garis putus Grayscale/Border/default, min. 168px,
 *               ikon unggah, "Seret file ke sini" + tombol "Pilih file"
 *   dragover  : latar Primary/Surface/subtitle, garis 2px Primary
 *   disabled  : latar & garis Grayscale disabled, "Unggah dinonaktifkan"
 *   uploading : kartu file + "Mengunggah · n%" + progress 4px
 *   success   : kartu file + centang "File berhasil diunggah."
 *   error     : kartu file ber-border Semantic/Error + "Coba lagi",
 *               pesan error menggantikan helper
 * Komponen ini hanya tampilan + pemilih file; proses unggah diatur
 * pemanggil lewat `status` dan `progress`.
 */
type UploadStatus = "idle" | "uploading" | "success" | "error"

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function FileUpload({
  id,
  label,
  required,
  helper,
  accept,
  file,
  status = "idle",
  progress = 0,
  error,
  disabled,
  instruction = "Seret file ke sini",
  onSelect,
  onRemove,
  className,
}: {
  id?: string
  label?: React.ReactNode
  required?: boolean
  /* Format & batas ukuran, mis. "JPG, PNG, atau PDF · maks. 5 MB" */
  helper?: React.ReactNode
  /* Atribut accept pada input file, mis. "image/jpeg,image/png,application/pdf" */
  accept?: string
  file?: { name: string; size: number } | null
  status?: UploadStatus
  /* 0–100, dipakai saat status "uploading" */
  progress?: number
  /* Pesan error; ditampilkan menggantikan helper */
  error?: React.ReactNode
  disabled?: boolean
  instruction?: string
  onSelect: (file: File) => void
  onRemove?: () => void
  className?: string
}) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  const openPicker = () => inputRef.current?.click()

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0]
    if (picked) onSelect(picked)
  }

  const showFile = file != null && status !== "idle"

  return (
    <div
      data-slot="file-upload"
      className={cn("flex w-full flex-col gap-(--comp-gap-md)", className)}
    >
      {label != null && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : helper ? helperId : undefined}
        onChange={(e) => {
          handleFiles(e.target.files)
          /* Izinkan memilih file yang sama lagi setelah dihapus */
          e.target.value = ""
        }}
      />

      {showFile ? (
        <div
          className={cn(
            "flex flex-col gap-ns-m rounded-(--comp-radius-md) border bg-grayscale-surface-default p-ns-l leading-normal",
            status === "error" ? "border-error" : "border-grayscale-border-default"
          )}
        >
          <div className="flex items-center gap-ns-s">
            <FileTextIcon aria-hidden="true" className="size-6 shrink-0 text-grayscale-text-body" />
            <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs">
              <p className="truncate text-subtitle font-bold text-grayscale-text-body">
                {file.name}
              </p>
              <p className="text-caption text-grayscale-text-caption">
                {formatFileSize(file.size)}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                aria-label={status === "uploading" ? "Batalkan unggahan" : `Hapus ${file.name}`}
                onClick={onRemove}
                className="flex size-6 shrink-0 items-center justify-center rounded-sm text-grayscale-text-body outline-none hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
              >
                <XIcon className="size-5" />
              </button>
            )}
          </div>

          {status === "uploading" && (
            <>
              <p className="text-caption text-primary-text-primary" aria-live="polite">
                Mengunggah · {Math.round(progress)}%
              </p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={`Mengunggah ${file.name}`}
                className="h-1 w-full overflow-hidden rounded-sm bg-grayscale-surface-disabled"
              >
                <div
                  className="h-full rounded-sm bg-primary-surface-default transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </>
          )}
          {status === "success" && (
            <p className="flex items-center gap-ns-s text-caption text-grayscale-text-body">
              <CheckIcon aria-hidden="true" className="size-6 shrink-0 text-success" />
              File berhasil diunggah.
            </p>
          )}
          {status === "error" && (
            <Button
              variant="tertiary"
              className="w-fit"
              onClick={openPicker}
              disabled={disabled}
            >
              Coba lagi
            </Button>
          )}
        </div>
      ) : (
        <div
          onDragEnter={(e) => {
            e.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!disabled) handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            "flex min-h-42 flex-col items-center justify-center gap-ns-s rounded-(--comp-radius-md) border border-dashed p-ns-l text-center text-subtitle leading-normal",
            disabled
              ? "border-grayscale-border-disabled bg-grayscale-surface-disabled text-grayscale-text-body"
              : dragging
                ? "border-2 border-primary-border-default bg-primary-surface-subtitle text-primary-text-primary"
                : error
                  ? "border-error bg-grayscale-surface-default text-grayscale-text-body"
                  : "border-grayscale-border-default bg-grayscale-surface-default text-grayscale-text-body"
          )}
        >
          <UploadIcon aria-hidden="true" className="size-6" />
          <p className={cn(!disabled && !dragging && "font-bold")}>
            {disabled
              ? "Unggah dinonaktifkan"
              : dragging
                ? "Lepaskan file di sini"
                : instruction}
          </p>
          {!disabled && (
            <Button variant="secondary" onClick={openPicker}>
              Pilih file
            </Button>
          )}
        </div>
      )}

      {error ? (
        <p id={errorId} role="alert" className="text-caption leading-normal text-grayscale-text-negative">
          {error}
        </p>
      ) : (
        helper != null && (
          <p id={helperId} className="text-caption leading-normal text-grayscale-text-caption">
            {helper}
          </p>
        )
      )}
    </div>
  )
}

export { FileUpload, type UploadStatus }
