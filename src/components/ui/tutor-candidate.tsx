import * as React from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

/*
 * Tutor candidate · Figma PINTARA → Components → 05 · Data Display
 *
 * Kartu kandidat pada pencocokan siswa–tutor, dipilih seperti radio.
 * Padding 16, gap 12, radius 12. Default: border Grayscale/Border/default;
 * Selected: border 2px Primary/Border/default. Kriteria memakai ikon centang
 * (terpenuhi) atau silang (tidak terpenuhi).
 *
 * <RadioGroup value={tutorId} onValueChange={setTutorId}>
 *   <TutorCandidate value="t1" name="Kak Dimas Arya" initials="DA"
 *     education="S1 Pendidikan Fisika · Univ. Trunojoyo"
 *     criteria={[{ label: "Fisika & Matematika SMA", met: true }]}
 *     meta="Rating 4,8 · 4 siswa aktif" score="Cocok 92%" />
 * </RadioGroup>
 */
function TutorCandidate({
  value,
  name,
  initials,
  education,
  criteria = [],
  meta,
  score,
  disabled,
  className,
}: {
  value: string
  name: string
  initials: string
  education?: React.ReactNode
  criteria?: { label: React.ReactNode; met: boolean }[]
  meta?: React.ReactNode
  score?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  const id = React.useId()

  return (
    <label
      htmlFor={id}
      data-slot="tutor-candidate"
      className={cn(
        "flex w-full cursor-pointer flex-col gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l transition-colors",
        "hover:border-grayscale-border-darker has-data-checked:border-primary-border-default has-data-checked:ring-1 has-data-checked:ring-primary-border-default has-data-checked:ring-inset",
        "has-data-disabled:cursor-not-allowed has-data-disabled:bg-grayscale-surface-disabled",
        className
      )}
    >
      <div className="flex items-center gap-ns-m">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-surface-subtitle text-caption font-bold text-primary-text-primary"
        >
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-ns-3xs leading-normal">
          <span className="text-subtitle font-bold text-grayscale-text-title">
            {name}
          </span>
          {education != null && (
            <span className="text-caption text-grayscale-text-caption">
              {education}
            </span>
          )}
        </div>
        <span className="flex size-8 items-center justify-center">
          <RadioGroupItem id={id} value={value} disabled={disabled} aria-label={`Pilih ${name}`} />
        </span>
      </div>

      {criteria.length > 0 && (
        <ul className="flex flex-col gap-ns-s">
          {criteria.map((c, i) => (
            <li
              key={i}
              className="flex items-center gap-ns-s text-caption leading-normal text-grayscale-text-body"
            >
              {c.met ? (
                <CheckIcon aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <XIcon aria-hidden="true" className="size-4 shrink-0 text-error" />
              )}
              <span className="sr-only">{c.met ? "Terpenuhi:" : "Tidak terpenuhi:"}</span>
              {c.label}
            </li>
          ))}
        </ul>
      )}

      {(meta != null || score != null) && (
        <div className="flex items-center justify-between gap-ns-s">
          <span className="text-caption text-grayscale-text-caption">{meta}</span>
          {score != null && (
            <span className="rounded-full bg-primary-surface-subtitle px-ns-s py-ns-2xs text-caption font-bold whitespace-nowrap text-primary-text-primary">
              {score}
            </span>
          )}
        </div>
      )}
    </label>
  )
}

export { TutorCandidate }
