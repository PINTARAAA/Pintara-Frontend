import * as React from "react"

import { cn } from "@/lib/styles"

/*
 * FormGroup · "Group / …" pada frame W2 Pendaftaran Siswa.
 * Header: judul Body/Bold + deskripsi Caption (gap 4); isi berjarak 16.
 * Dirender sebagai <fieldset> agar grup checkbox/radio punya nama aksesibel.
 */
function FormGroup({
  title,
  description,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"fieldset">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <fieldset
      className={cn("flex min-w-0 flex-col gap-ns-l", className)}
      {...props}
    >
      <div className="flex flex-col gap-ns-2xs leading-normal">
        <legend className="contents text-body font-bold text-grayscale-text-title">
          {title}
        </legend>
        {description != null && (
          <p className="text-caption text-grayscale-text-caption">
            {description}
          </p>
        )}
      </div>
      {children}
    </fieldset>
  )
}

/*
 * SummaryRow · "Row / …" pada kartu ringkasan: label Caption 110px +
 * nilai Subtitle/Bold. `align="between"` untuk kartu Ringkasan di layar
 * Berhasil (label kiri, nilai rata kanan).
 */
function SummaryRow({
  label,
  align = "start",
  labelClassName,
  children,
}: {
  label: React.ReactNode
  align?: "start" | "between"
  /* Lebar label default 110px (Ringkasan W2); W3 memakai 100px */
  labelClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex gap-ns-m leading-normal",
        align === "between" ? "items-center justify-between" : "items-start"
      )}
    >
      <dt
        className={cn(
          "text-caption text-grayscale-text-caption",
          align === "start" && "w-[110px] shrink-0",
          labelClassName
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-subtitle font-bold text-grayscale-text-title",
          align === "start" ? "flex-1" : "text-right"
        )}
      >
        {children}
      </dd>
    </div>
  )
}

export { FormGroup, SummaryRow }
