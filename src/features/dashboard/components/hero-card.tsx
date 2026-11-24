import * as React from "react"
import { Link } from "react-router"

import { cn } from "@/lib/styles/cn"

/*
 * HeroCard · kartu utama beranda (Figma: "Next session" Wali, "Les
 * berikutnya" Tutor, "Hari ini" Pengelola).
 * Primary/Surface/default, padding 20, radius 12, gap 16, teks putih:
 *   eyebrow (Caption/Bold) + pil (Primary/Surface/darker) ·
 *   judul (H4/Bold) + subjudul · garis Primary/Surface/lighter · footer.
 * Jika `to` diisi, seluruh kartu menjadi tautan.
 */
function HeroCard({
  eyebrow,
  badge,
  title,
  subtitle,
  footer,
  to,
  label,
  className,
}: {
  eyebrow: React.ReactNode
  badge?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  footer?: React.ReactNode
  to?: string
  /* Nama aksesibel bila kartu berupa tautan */
  label?: string
  className?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-ns-s">
        <p className="text-caption font-bold">{eyebrow}</p>
        {badge != null && (
          <span className="rounded-full bg-primary-surface-darker px-ns-m py-ns-2xs text-caption font-bold whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-ns-2xs">
        <p className="text-h4 font-bold">{title}</p>
        {subtitle != null && (
          <p className="text-subtitle leading-normal">{subtitle}</p>
        )}
      </div>
      {footer != null && (
        <>
          <div aria-hidden="true" className="h-px bg-primary-surface-lighter" />
          {footer}
        </>
      )}
    </>
  )

  const classes = cn(
    "flex flex-col gap-ns-l rounded-(--comp-radius-md) bg-primary-surface-default p-ns-xl text-primary-text-label",
    to &&
      "transition-colors outline-none hover:bg-primary-600 focus-visible:ring-3 focus-visible:ring-primary-border-lighter",
    className
  )

  return to ? (
    <Link to={to} aria-label={label} className={classes}>
      {body}
    </Link>
  ) : (
    <section aria-label={label} className={classes}>
      {body}
    </section>
  )
}

/* Baris di bawah garis HeroCard: avatar/ikon + judul + keterangan */
function HeroCardRow({
  leading,
  title,
  description,
}: {
  leading: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-ns-m">
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
        <p className="text-subtitle font-bold">{title}</p>
        {description != null && <p className="text-caption">{description}</p>}
      </div>
    </div>
  )
}

export { HeroCard, HeroCardRow }
