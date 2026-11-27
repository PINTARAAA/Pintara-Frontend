import * as React from "react"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/styles"

/*
 * Page header · header halaman desktop (Figma "… (Desktop)" → "Page header").
 *
 * Pengganti Top app bar di desktop: tautan kembali opsional (ikon 16 +
 * Subtitle/Bold Primary/Text/primary, gap 6) di atas judul H3/Bold, gap 8.
 * Aksi (mis. tombol halaman) rata kanan, sejajar dasar judul, gap 12.
 * Tidak menempel dan tanpa garis bawah.
 * `subtitle` (mis. sapaan beranda, Body/Regular Grayscale/Text/subtitle)
 * tampil di atas judul dengan gap 4; aksi lalu rata tengah vertikal.
 * `description` (Body/Regular Grayscale/Text/subtitle) tampil di bawah
 * judul dengan gap 8, mis. jam · sejak pada Detail Jadwal (W4).
 *
 * <PageHeader title="Detail Pendaftaran"
 *   back={{ label: "Pendaftaran", onClick: () => navigate(-1) }}
 *   actions={<><Button variant="secondary">Tolak</Button><Button>Verifikasi</Button></>} />
 */
function PageHeader({
  title,
  subtitle,
  description,
  back,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"header">, "title"> & {
  title: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  back?: { label: string; onClick: () => void }
  actions?: React.ReactNode
}) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex w-full justify-between gap-ns-l",
        subtitle != null ? "items-center" : "items-end",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col items-start gap-ns-s">
        {back && (
          <button
            type="button"
            onClick={back.onClick}
            className="flex items-center gap-ns-xs rounded-(--comp-radius-sm) text-subtitle leading-normal font-bold text-primary-text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4 shrink-0" />
            {back.label}
          </button>
        )}
        {subtitle != null ? (
          <div className="flex flex-col gap-ns-2xs">
            <p className="text-body leading-normal text-grayscale-text-subtitle">
              {subtitle}
            </p>
            <h1 className="text-h3 font-bold text-grayscale-text-title">
              {title}
            </h1>
          </div>
        ) : (
          <h1 className="text-h3 font-bold text-grayscale-text-title">
            {title}
          </h1>
        )}
        {description != null && (
          <p className="text-body leading-normal text-grayscale-text-subtitle">
            {description}
          </p>
        )}
      </div>
      {actions != null && (
        <div className="flex shrink-0 items-center gap-ns-m">{actions}</div>
      )}
    </header>
  )
}

export { PageHeader }
