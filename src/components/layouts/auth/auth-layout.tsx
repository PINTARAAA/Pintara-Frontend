import * as React from "react"
import {
  CalendarDaysIcon,
  ClipboardCheckIcon,
  InfoIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import pintaraLogo from "@/assets/pintara-logo.png"
import { cn } from "@/lib/styles"

/*
 * AuthLayout · Figma PINTARA → UI Screen → Umum → 00 · Autentikasi
 *
 * Mobile (< lg, frame "Login / …"): latar Primary/Surface/default. Hero
 *   (px 24, py 40, gap 12): logo 80px radius 16, "PINTARA" (H3/Bold) dan
 *   tagline putih. Di bawahnya lembaran putih bersudut atas 24px (pt 32,
 *   px 24, pb 24, gap 24) berisi judul, deskripsi, konten, dan footer.
 *
 * Desktop (≥ lg, frame "Login / … (Desktop)", 1440 × 900): layar terbelah.
 *   Kiri  — panel merek biru (maks. 640px, px 64, py 56): logo + nama,
 *           headline, deskripsi, tiga poin unggulan, dan hak cipta di bawah.
 *   Kanan — kartu form selebar 400px di tengah panel putih: judul H3,
 *           deskripsi Body, konten, lalu `note` (hanya tampil di desktop).
 *   Hero mobile dan footer di lembaran disembunyikan; panel merek hanya
 *   dirender di desktop sehingga tampilan mobile tidak berubah.
 */

const HIGHLIGHTS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: CalendarDaysIcon,
    title: "Jadwal les terpusat",
    description: "Pantau jadwal dan perubahan jadwal les di satu tempat.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Presensi tervalidasi",
    description: "Presensi tutor diverifikasi wali murid dan pengelola.",
  },
  {
    icon: WalletIcon,
    title: "Tagihan & honor transparan",
    description: "Tagihan siswa dan honor tutor tercatat dengan rapi.",
  },
]

function AuthBrandPanel({ footer }: { footer?: React.ReactNode }) {
  return (
    <aside className="relative hidden w-[min(44%,40rem)] shrink-0 flex-col justify-between overflow-hidden px-16 py-14 text-primary-text-label lg:flex">
      {/* Dekorasi lingkaran (Primary/Surface/darker) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-45 -right-45 size-130 rounded-full bg-primary-surface-darker/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-45 size-90 rounded-full bg-primary-surface-darker/25"
      />

      <div className="relative flex items-center gap-ns-m">
        <img
          src={pintaraLogo}
          alt=""
          className="size-12 rounded-(--comp-radius-md) object-cover"
        />
        <div className="flex flex-col">
          <p className="text-h4 font-bold">PINTARA</p>
          <p className="text-caption text-primary-100">LBB Jelajah Ilmu</p>
        </div>
      </div>

      <div className="relative flex flex-col gap-ns-4xl">
        <div className="flex flex-col gap-ns-l">
          <p className="max-w-128 text-h2 font-bold">
            Kelola les privat jadi lebih mudah dan tertata.
          </p>
          <p className="max-w-120 text-body leading-normal text-primary-100">
            Satu sistem untuk wali murid, tutor, dan pengelola LBB Jelajah Ilmu —
            dari pendaftaran, jadwal, presensi, hingga pembayaran.
          </p>
        </div>

        <ul className="flex flex-col gap-ns-xl">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-center gap-ns-l">
              <span className="grid size-11 shrink-0 place-items-center rounded-(--comp-radius-md) bg-primary-600">
                <Icon aria-hidden className="size-6" />
              </span>
              <span className="flex flex-col gap-ns-3xs">
                <span className="text-body font-bold">{title}</span>
                <span className="text-subtitle leading-normal text-primary-100">
                  {description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {footer != null ? (
        <p className="relative text-caption text-primary-100">{footer}</p>
      ) : (
        <span />
      )}
    </aside>
  )
}

function AuthLayout({
  title,
  description,
  note,
  footer = `© ${new Date().getFullYear()} LBB Jelajah Ilmu`,
  className,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  note?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col bg-primary-surface-default lg:flex-row">
      {/* Hero mobile */}
      <header className="flex flex-col items-center gap-ns-m px-ns-2xl py-ns-4xl text-center text-primary-text-label lg:hidden">
        <img
          src={pintaraLogo}
          alt=""
          className="size-20 rounded-(--comp-radius-lg) object-cover"
        />
        <div className="flex flex-col gap-ns-2xs">
          <p className="text-h3 font-bold">PINTARA</p>
          <p className="text-subtitle leading-normal">
            Sistem Informasi Manajemen LBB Jelajah Ilmu
          </p>
        </div>
      </header>

      <AuthBrandPanel footer={footer} />

      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-2xl rounded-t-(--spacing-ns-2xl) bg-grayscale-surface-default px-ns-2xl pt-ns-3xl pb-ns-2xl",
          "lg:items-center lg:justify-center lg:rounded-none lg:px-16 lg:py-14",
          className
        )}
      >
        <div className="flex w-full flex-col gap-ns-2xl lg:max-w-100 lg:gap-ns-3xl">
          <div className="flex flex-col gap-ns-2xs lg:gap-ns-s">
            <h1 className="text-headline font-bold text-grayscale-text-title lg:text-h3">
              {title}
            </h1>
            {description != null && (
              <p className="text-subtitle leading-normal text-grayscale-text-subtitle lg:text-body lg:leading-normal">
                {description}
              </p>
            )}
          </div>
          {children}
          {note != null && (
            <div className="hidden items-center gap-ns-s rounded-(--comp-radius-sm) bg-grayscale-surface-subtitle px-ns-l py-ns-m text-grayscale-text-subtitle lg:flex">
              <InfoIcon aria-hidden className="size-5 shrink-0" />
              <p className="text-subtitle leading-normal">{note}</p>
            </div>
          )}
        </div>
        {footer != null && (
          <p className="mt-auto text-center text-caption text-grayscale-text-caption lg:hidden">
            {footer}
          </p>
        )}
      </main>
    </div>
  )
}

export { AuthLayout }
