import * as React from "react"
import { StarIcon } from "lucide-react"

import { cn } from "@/lib/styles"

/*
 * Rating · Figma PINTARA → Wali Murid → W5 "Rating & ulasan"
 *
 * 5 bintang 36px (Icon / Star, stroke 2px), jarak 8. Terisi = Semantic/
 * Warning; kosong = garis Grayscale/Text/body. Dibangun dari radio asli
 * agar bisa dipilih dengan keyboard (panah kiri/kanan) dan dibaca screen
 * reader. Label nilai (mis. "Baik") ditampilkan oleh pemanggil.
 */
function Rating({
  value,
  onValueChange,
  max = 5,
  labels,
  name,
  invalid,
  className,
  ...props
}: Omit<React.ComponentProps<"fieldset">, "onChange"> & {
  value: number
  onValueChange: (value: number) => void
  max?: number
  /* Nama tiap nilai untuk pembaca layar, mis. ["Sangat kurang", …] */
  labels?: string[]
  name?: string
  invalid?: boolean
}) {
  const fallbackName = React.useId()
  const groupName = name ?? fallbackName

  return (
    <fieldset
      data-slot="rating"
      aria-invalid={invalid || undefined}
      className={cn("flex items-center gap-ns-s", className)}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1
        const filled = n <= value
        return (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={groupName}
              value={n}
              checked={value === n}
              onChange={() => onValueChange(n)}
              className="peer sr-only"
            />
            <span className="sr-only">
              {labels?.[i] ? `${n} bintang, ${labels[i]}` : `${n} bintang`}
            </span>
            <StarIcon
              aria-hidden="true"
              strokeWidth={2}
              className={cn(
                "size-9 rounded-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-border-lighter",
                filled
                  ? "fill-warning text-warning"
                  : invalid
                    ? "text-grayscale-text-negative"
                    : "text-grayscale-text-body hover:text-warning"
              )}
            />
          </label>
        )
      })}
    </fieldset>
  )
}

export { Rating }
