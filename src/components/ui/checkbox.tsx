"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"
import {
  cn,
  choiceFocusRing,
  choiceLabelVariants,
  type FieldSize,
} from "@/lib/styles"

/*
 * Checkbox · Figma PINTARA → Components → 02 · Form Controls → Checkbox
 * Size: sm (20px) · default/Medium (24px) · lg (32px), radius 4.
 * Value: unchecked · checked · indeterminate. Isi `label` untuk menampilkan
 * label di sampingnya (Show label).
 */
const boxSize: Record<FieldSize, string> = {
  sm: "size-5 [&_svg]:size-3.5",
  default: "size-6 [&_svg]:size-4",
  lg: "size-8 [&_svg]:size-5",
}

function Checkbox({
  className,
  size = "default",
  label,
  ...props
}: CheckboxPrimitive.Root.Props & {
  size?: FieldSize
  label?: React.ReactNode
}) {
  const control = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-size={size}
      className={cn(
        "group/checkbox peer relative flex shrink-0 items-center justify-center rounded-sm border border-grayscale-border-default bg-grayscale-surface-default text-primary-text-label transition-colors hover:border-grayscale-border-darker",
        choiceFocusRing,
        "data-checked:border-primary-surface-default data-checked:bg-primary-surface-default data-checked:hover:border-primary-surface-darker data-checked:hover:bg-primary-surface-darker",
        "data-indeterminate:border-primary-surface-default data-indeterminate:bg-primary-surface-default data-indeterminate:hover:border-primary-surface-darker data-indeterminate:hover:bg-primary-surface-darker",
        "aria-invalid:border-error",
        "data-disabled:cursor-not-allowed data-disabled:border-grayscale-surface-disabled data-disabled:bg-grayscale-surface-disabled data-disabled:text-grayscale-text-disabled",
        boxSize[size],
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon
          strokeWidth={2.5}
          className="group-data-indeterminate/checkbox:hidden"
        />
        <MinusIcon
          strokeWidth={2.5}
          className="hidden group-data-indeterminate/checkbox:block"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (label == null) return control

  return (
    <label className={choiceLabelVariants({ size })}>
      {control}
      <span>{label}</span>
    </label>
  )
}

export { Checkbox }
