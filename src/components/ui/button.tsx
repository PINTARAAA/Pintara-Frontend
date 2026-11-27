import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/styles"

/*
 * Button · Figma PINTARA → Components → 01 · Actions → Button
 *
 * Variant : primary · secondary · tertiary · destructive
 * Size    : sm · default (Medium) · lg
 * Icon    : letakkan <svg> sebelum/sesudah label (Left/Right), atau pakai
 *           size="icon-sm" | "icon" | "icon-lg" untuk Icon=Alone.
 *
 * Ukuran mengikuti Token Komponen (radius, gap, padding, icon size) per mode
 * Small / Medium / Large; warna mengikuti Style Tokens.
 *
 * Figma belum mendefinisikan state hover/disabled, jadi state tersebut
 * memakai token terdekat (lihat masing-masing variant).
 */

const primary =
  "bg-primary-surface-default text-primary-text-label hover:bg-primary-600 disabled:bg-grayscale-surface-disabled"
const secondary =
  "border-primary-border-default bg-grayscale-surface-default text-primary-text-link hover:bg-primary-surface-subtitle aria-expanded:bg-primary-surface-subtitle disabled:border-grayscale-border-disabled disabled:bg-grayscale-surface-default"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding leading-none font-normal whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:text-grayscale-text-disabled aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary,
        secondary,
        tertiary:
          "bg-transparent text-primary-text-link hover:bg-primary-surface-subtitle aria-expanded:bg-primary-surface-subtitle",
        destructive:
          "bg-error text-primary-text-label hover:bg-error/90 focus-visible:ring-destructive/30 disabled:bg-grayscale-surface-disabled",
        /* Di luar Figma: utilitas netral untuk tombol tutup, navigasi kalender, dll. */
        ghost:
          "text-grayscale-text-body hover:bg-muted aria-expanded:bg-muted",
        link: "h-auto! p-0! text-primary-text-link underline-offset-4 hover:underline",
        /* Alias nama shadcn agar komponen bawaan tetap berfungsi */
        default: primary,
        outline: secondary,
      },
      size: {
        /* Small: radius 8 · gap 4 · px 16 · py 8 · icon 20 · teks 13 */
        sm: "min-h-9 gap-(--comp-gap-sm) rounded-(--comp-radius-sm) px-(--comp-px-sm) py-(--comp-py-sm) text-subtitle [&_svg:not([class*='size-'])]:size-(--comp-icon-sm)",
        /* Medium: radius 12 · gap 8 · px 20 · py 12 · icon 24 · teks 13 */
        default:
          "min-h-12 gap-(--comp-gap-md) rounded-(--comp-radius-md) px-(--comp-px-md) py-(--comp-py-md) text-subtitle [&_svg:not([class*='size-'])]:size-(--comp-icon-md)",
        /* Large: radius 16 · gap 12 · px 24 · py 16 · icon 32 · teks 16 */
        lg: "min-h-16 gap-(--comp-gap-lg) rounded-(--comp-radius-lg) px-(--comp-px-lg) py-(--comp-py-lg) text-body [&_svg:not([class*='size-'])]:size-(--comp-icon-lg)",
        /* Icon=Alone: padding = V-Padding, jadi tombol berbentuk persegi */
        "icon-sm":
          "size-9 rounded-(--comp-radius-sm) [&_svg:not([class*='size-'])]:size-(--comp-icon-sm)",
        icon: "size-12 rounded-(--comp-radius-md) [&_svg:not([class*='size-'])]:size-(--comp-icon-md)",
        "icon-lg":
          "size-16 rounded-(--comp-radius-lg) [&_svg:not([class*='size-'])]:size-(--comp-icon-lg)",
        /* Di luar Figma: ukuran ringkas untuk tombol tutup dialog/sheet */
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
