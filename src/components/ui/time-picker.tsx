"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/styles"

/*
 * Time picker · Figma PINTARA → Components → 03 · Date & Time → Time picker
 *
 * Satu ukuran (Medium, field 48px) dengan ikon jam. Panel ".Time panel" =
 * daftar Dropdown item dengan header "WIB · Format 24 jam" (Subtitle/Bold),
 * padding 8px vertikal / 4px horizontal, gap 4px. Nilai berformat "HH.mm"
 * (mis. "09.30"), sesuai penulisan waktu Indonesia.
 */

/* Buat daftar waktu "HH.mm" dari `start` sampai `end` setiap `step` menit */
function buildTimeOptions(start = "07.00", end = "21.00", step = 30) {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(/[.:]/).map(Number)
    return h * 60 + m
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  const options: string[] = []
  for (let t = toMinutes(start); t <= toMinutes(end); t += step) {
    options.push(`${pad(Math.floor(t / 60))}.${pad(t % 60)}`)
  }
  return options
}

function TimePicker({
  value,
  defaultValue,
  onValueChange,
  options,
  start,
  end,
  step,
  header = "WIB · Format 24 jam",
  placeholder = "Pilih waktu",
  disabled,
  invalid,
  id,
  className,
}: {
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /* Daftar waktu manual; jika kosong dibuat dari start/end/step */
  options?: string[]
  start?: string
  end?: string
  step?: number
  header?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
}) {
  const items = React.useMemo(
    () => options ?? buildTimeOptions(start, end, step),
    [options, start, end, step]
  )

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => onValueChange?.(v as string | null)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        icon={<ClockIcon />}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80 py-ns-s">
        <SelectGroup className="flex flex-col gap-ns-2xs p-0">
          {header != null && (
            <SelectLabel className="sticky top-0 z-10 -mx-ns-2xs bg-grayscale-surface-default px-ns-2xs py-ns-2xs text-subtitle font-bold text-grayscale-text-title">
              {header}
            </SelectLabel>
          )}
          {items.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export { TimePicker }
