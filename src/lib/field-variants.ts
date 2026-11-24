import { cva, type VariantProps } from "class-variance-authority"

/*
 * Gaya bersama untuk kontrol form (Input, Textarea, Select trigger).
 * Figma PINTARA → Components → 02 · Form Controls → Input / Textarea.
 *
 * State Figma → CSS:
 *   Default  : border Grayscale/Border/default
 *   Hover    : border Grayscale/Border/darker
 *   Focused  : border 2px Primary/Border/default (1px border + 1px inset ring)
 *   Error    : border Semantic/Error              (aria-invalid="true")
 *   Disabled : surface & border Grayscale/*-disabled
 */
export const fieldControlVariants = cva(
  "w-full min-w-0 border border-grayscale-border-default bg-grayscale-surface-default font-normal text-grayscale-text-body transition-colors outline-none placeholder:text-grayscale-text-subtitle hover:border-grayscale-border-darker focus-visible:border-primary-border-default focus-visible:ring-1 focus-visible:ring-primary-border-default focus-visible:ring-inset aria-invalid:border-error aria-invalid:focus-visible:ring-error disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-grayscale-border-disabled disabled:bg-grayscale-surface-disabled",
  {
    variants: {
      size: {
        /* Small: radius 8 · px 16 · tinggi 36 · teks 13 */
        sm: "rounded-(--comp-radius-sm) px-(--comp-px-sm) text-subtitle",
        /* Medium: radius 12 · px 20 · tinggi 48 · teks 13 */
        default: "rounded-(--comp-radius-md) px-(--comp-px-md) text-subtitle",
        /* Large: radius 16 · px 24 · tinggi 64 · teks 16 */
        lg: "rounded-(--comp-radius-lg) px-(--comp-px-lg) text-body",
      },
    },
    defaultVariants: { size: "default" },
  }
)

/* Tinggi kontrol satu baris (Input, Select trigger) */
export const fieldHeight = {
  sm: "h-9",
  default: "h-12",
  lg: "h-16",
} as const

/*
 * Baris label untuk Checkbox / Radio / Toggle ("Control area" + "Label").
 * Tinggi baris 36 · 48 · 64, gap = Token Komponen Spacing, teks 13 · 13 · 16.
 */
export const choiceLabelVariants = cva(
  "inline-flex cursor-pointer items-center font-normal text-grayscale-text-body select-none has-data-disabled:cursor-not-allowed has-data-disabled:text-grayscale-text-disabled",
  {
    variants: {
      size: {
        sm: "min-h-9 gap-(--comp-gap-sm) text-subtitle",
        default: "min-h-12 gap-(--comp-gap-md) text-subtitle",
        lg: "min-h-16 gap-(--comp-gap-lg) text-body",
      },
    },
    defaultVariants: { size: "default" },
  }
)

/* Cincin fokus Figma: 2px Primary/Border/lighter, berjarak 1px dari kontrol */
export const choiceFocusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-border-lighter"

export type FieldSize = NonNullable<
  VariantProps<typeof fieldControlVariants>["size"]
>
