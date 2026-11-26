import type * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import {
  STATUS_MAP,
  type StatusCategory,
  type StatusOf,
  type StatusTone,
} from "@/lib/constants"
import { cn } from "@/lib/styles"

/*
 * Badge · Figma PINTARA → Components → 05 · Data Display → Badge
 *
 * Satu ukuran: tinggi 28px, px 12, gap 6, radius 8, teks 13 Grayscale/Text/
 * body. Latar = warna semantik subtle, titik 6px = warna semantik penuh.
 *
 * Pakai <StatusBadge category="pembayaran" status="lunas" /> agar label dan
 * warna selalu sesuai status, atau <Badge tone="info">Teks bebas</Badge>.
 */
const toneClass: Record<StatusTone, string> = {
  success: "bg-success-subtle [--badge-dot:var(--color-success)]",
  warning: "bg-warning-subtle [--badge-dot:var(--color-warning)]",
  error: "bg-error-subtle [--badge-dot:var(--color-error)]",
  info: "bg-info-subtle [--badge-dot:var(--color-info)]",
  neutral: "bg-grayscale-surface-disabled [--badge-dot:var(--color-neutral-800)]",
}

function Badge({
  className,
  tone = "neutral",
  dot = true,
  render,
  children,
  ...props
}: useRender.ComponentProps<"span"> & {
  tone?: StatusTone
  /* Show dot */
  dot?: boolean
}) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(
      {
        "data-slot": "badge",
        "data-tone": tone,
        className: cn(
          "inline-flex h-7 w-fit shrink-0 items-center justify-center gap-ns-xs rounded-md px-ns-m text-subtitle leading-none font-normal whitespace-nowrap text-grayscale-text-body",
          toneClass[tone],
          className
        ),
        children: (
          <>
            {dot && (
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-(--badge-dot)"
              />
            )}
            {children}
          </>
        ),
      } as React.ComponentProps<"span">,
      props
    ),
  })
}

function StatusBadge<C extends StatusCategory>({
  category,
  status,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "tone" | "children"> & {
  category: C
  status: StatusOf<C>
}) {
  const { label, tone } = STATUS_MAP[category][status] as {
    label: string
    tone: StatusTone
  }
  return (
    <Badge tone={tone} {...props}>
      {label}
    </Badge>
  )
}

export { Badge, StatusBadge }
