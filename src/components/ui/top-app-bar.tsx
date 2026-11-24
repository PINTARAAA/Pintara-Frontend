import * as React from "react"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/styles/cn"

/*
 * Top app bar · Figma PINTARA → Components → 04 · Navigation → Top app bar
 *
 * Header layar mobile. Padding 16 / 12, gap 12, garis bawah
 * Grayscale/Border/disabled.
 *   variant="main"   : subtitle sapaan (Caption) + judul (Headline/Bold) + aksi
 *                      (mis. lonceng notifikasi) — untuk beranda tiap peran.
 *   variant="detail" : tombol kembali + judul (Body/Bold) + aksi opsional —
 *                      untuk halaman turunan.
 *
 * <TopAppBar title="Budi" subtitle="Selamat datang,"
 *   action={<TopAppBarButton label="Notifikasi" dot><BellIcon /></TopAppBarButton>} />
 * <TopAppBar variant="detail" title="Detail Les" onBack={() => navigate(-1)}
 *   action={<TopAppBarButton label="Lainnya"><EllipsisIcon /></TopAppBarButton>} />
 */
function TopAppBar({
  variant = "main",
  title,
  subtitle,
  onBack,
  backLabel = "Kembali",
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"header">, "title"> & {
  variant?: "main" | "detail"
  title: React.ReactNode
  subtitle?: React.ReactNode
  onBack?: () => void
  backLabel?: string
  action?: React.ReactNode
}) {
  return (
    <header
      data-slot="top-app-bar"
      data-variant={variant}
      className={cn(
        "flex w-full items-center gap-ns-m border-b border-grayscale-border-disabled bg-grayscale-surface-default px-ns-l py-ns-m",
        className
      )}
      {...props}
    >
      {variant === "detail" && (
        <TopAppBarButton label={backLabel} onClick={onBack} variant="plain">
          <ArrowLeftIcon />
        </TopAppBarButton>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs">
        {variant === "main" && subtitle != null && (
          <p className="text-caption leading-normal text-grayscale-text-caption">
            {subtitle}
          </p>
        )}
        <h1
          className={cn(
            "truncate font-bold text-grayscale-text-title",
            variant === "main" ? "text-headline" : "text-body leading-normal"
          )}
        >
          {title}
        </h1>
      </div>
      {action}
    </header>
  )
}

/* Tombol ikon bulat 40px (ikon 24px). `dot` = titik notifikasi Semantic/Error. */
function TopAppBarButton({
  label,
  dot,
  variant = "filled",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  label: string
  dot?: boolean
  /* filled = latar Grayscale/Surface/subtitle (Main), plain = tanpa latar (Detail) */
  variant?: "filled" | "plain"
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-slot="top-app-bar-button"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full text-grayscale-text-body transition-colors outline-none hover:bg-grayscale-surface-disabled focus-visible:ring-2 focus-visible:ring-primary-border-lighter [&_svg]:size-6 [&_svg]:shrink-0",
        variant === "filled" && "bg-grayscale-surface-subtitle",
        className
      )}
      {...props}
    >
      {children}
      {dot && (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 size-2 rounded-full bg-error ring-2 ring-grayscale-surface-subtitle"
        />
      )}
    </button>
  )
}

export { TopAppBar, TopAppBarButton }
