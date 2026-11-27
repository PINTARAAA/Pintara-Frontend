import * as React from "react"
import { CircleAlertIcon, InboxIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/styles"

/*
 * Data state · Figma PINTARA → Components → 05 · Data Display → Data state
 *
 * Tampilan loading / empty / error untuk area data. Tinggi minimum 320px
 * agar layout tidak bergeser saat state berganti. Loading memakai 4 baris
 * skeleton statis; empty & error berisi ikon, judul (Body/Bold), deskripsi
 * dan tombol primary medium opsional.
 *
 * <DataState state="empty" title="Belum ada data"
 *   description="Data akan ditampilkan di sini setelah ditambahkan."
 *   action={{ label: "Tambah data", onClick: … }} />
 */
type DataStateProps = Omit<React.ComponentProps<"div">, "title"> & {
  state: "loading" | "empty" | "error"
  title?: React.ReactNode
  description?: React.ReactNode
  /* Teks di bawah skeleton; null untuk menyembunyikan */
  loadingLabel?: React.ReactNode
  icon?: React.ReactNode | null
  action?: { label: string; onClick: () => void }
  /* Tanpa border/latar, untuk dipakai di dalam Card atau Table */
  bare?: boolean
  rows?: number
}

const defaults = {
  empty: {
    title: "Belum ada data",
    description: "Data akan ditampilkan di sini setelah ditambahkan.",
    icon: <InboxIcon />,
  },
  error: {
    title: "Data gagal dimuat",
    description: "Terjadi kendala saat mengambil data. Silakan coba lagi.",
    icon: <CircleAlertIcon />,
  },
}

/* .Skeleton row: identitas (2 garis) · nilai · status */
function SkeletonRow() {
  return (
    <div className="flex h-10 items-center gap-ns-l">
      <div className="flex min-w-0 flex-1 flex-col gap-ns-s">
        <Skeleton className="h-3 w-full max-w-40" />
        <Skeleton className="h-2 w-full max-w-24 bg-grayscale-surface-subtitle" />
      </div>
      <Skeleton className="h-3 w-25 shrink-0" />
      <Skeleton className="h-5 w-16 shrink-0" />
    </div>
  )
}

function DataState({
  state,
  title,
  description,
  loadingLabel = "Memuat data…",
  icon,
  action,
  bare,
  rows = 4,
  className,
  ...props
}: DataStateProps) {
  const frame = cn(
    "flex min-h-80 w-full flex-col",
    !bare &&
      "rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default",
    /*
     * Desktop (Figma "… Kosong (Desktop)"): kartu kosong/error 480px di
     * tengah, bukan selebar konten. Loading tetap selebar daftar.
     */
    !bare && state !== "loading" && "lg:mx-auto lg:max-w-120",
    className
  )

  if (state === "loading") {
    return (
      <div
        data-slot="data-state"
        data-state="loading"
        role="status"
        aria-busy="true"
        className={cn(frame, "gap-ns-2xl p-ns-l")}
        {...props}
      >
        <div className="flex flex-col gap-ns-s">
          <Skeleton className="h-3 w-25" />
          <Skeleton className="h-2 w-36 bg-grayscale-surface-subtitle" />
        </div>
        <div className="flex flex-col gap-ns-m">
          {Array.from({ length: rows }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
        {loadingLabel != null ? (
          <p className="mt-auto text-caption text-grayscale-text-caption">
            {loadingLabel}
          </p>
        ) : (
          <span className="sr-only">Memuat data</span>
        )}
      </div>
    )
  }

  const d = defaults[state]
  const shownIcon = icon === undefined ? d.icon : icon

  return (
    <div
      data-slot="data-state"
      data-state={state}
      role={state === "error" ? "alert" : undefined}
      className={cn(
        frame,
        "items-center justify-center gap-ns-l p-ns-2xl text-center"
      )}
      {...props}
    >
      {shownIcon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 items-center justify-center rounded-md bg-grayscale-surface-subtitle [&_svg]:size-5",
            state === "error" ? "text-grayscale-text-negative" : "text-grayscale-text-body"
          )}
        >
          {shownIcon}
        </span>
      )}
      <div className="flex flex-col gap-ns-s">
        <p className="text-body leading-normal font-bold text-grayscale-text-title">
          {title ?? d.title}
        </p>
        <p className="text-subtitle leading-normal text-grayscale-text-subtitle">
          {description ?? d.description}
        </p>
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}

export { DataState }
