import * as React from "react"

import pintaraLogo from "@/assets/pintara-logo.png"
import { cn } from "@/lib/styles/cn"

/*
 * AuthLayout · Figma PINTARA → UI Screen → Umum → 00 · Autentikasi
 *
 * Mobile (sesuai Figma): latar Primary/Surface/default. Hero (px 24, py 40,
 *   gap 12): logo 80px radius 16, "PINTARA" (H3/Bold) dan tagline putih.
 *   Di bawahnya lembaran putih bersudut atas 24px (pt 32, px 24, pb 24,
 *   gap 24) berisi judul, deskripsi, konten, dan footer hak cipta.
 * Desktop (≥ lg, turunan dari mobile): layar terbelah — panel merek biru di
 *   kiri, form di kanan dengan lebar maks. 400px di tengah panel.
 */
function AuthLayout({
  title,
  description,
  footer = `© ${new Date().getFullYear()} LBB Jelajah Ilmu`,
  className,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col bg-primary-surface-default lg:flex-row">
      <header className="flex flex-col items-center gap-ns-m px-ns-2xl py-ns-4xl text-center text-primary-text-label lg:flex-1 lg:justify-center lg:gap-ns-2xl">
        <img
          src={pintaraLogo}
          alt=""
          className="size-20 rounded-(--comp-radius-lg) object-cover lg:size-28"
        />
        <div className="flex flex-col gap-ns-2xs lg:gap-ns-s">
          <p className="text-h3 font-bold lg:text-h1">PINTARA</p>
          <p className="text-subtitle leading-normal lg:text-body">
            Sistem Informasi Manajemen LBB Jelajah Ilmu
          </p>
        </div>
      </header>

      <main
        className={cn(
          "flex flex-1 flex-col gap-ns-2xl rounded-t-(--spacing-ns-2xl) bg-grayscale-surface-default px-ns-2xl pt-ns-3xl pb-ns-2xl",
          "lg:max-w-160 lg:flex-1 lg:items-center lg:rounded-none lg:px-ns-4xl",
          className
        )}
      >
        <div className="flex w-full flex-col gap-ns-2xl lg:my-auto lg:max-w-100">
          <div className="flex flex-col gap-ns-2xs">
            <h1 className="text-headline font-bold text-grayscale-text-title">
              {title}
            </h1>
            {description != null && (
              <p className="text-subtitle leading-normal text-grayscale-text-subtitle">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
        {footer != null && (
          <p className="mt-auto text-center text-caption text-grayscale-text-caption lg:mt-0">
            {footer}
          </p>
        )}
      </main>
    </div>
  )
}

export { AuthLayout }
