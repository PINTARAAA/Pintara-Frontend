"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/styles/cn"

import {
  choiceFocusRing,
  choiceLabelVariants,
  type FieldSize,
} from "@/lib/styles/field-variants"

/*
 * Switch · Figma PINTARA → Components → 02 · Form Controls → Toggle
 * Track Medium 44×24 dengan thumb 20px (jarak 2px); Small 36×20, Large 60×32.
 * Off: Grayscale/Border/default · On: Primary/Surface/default.
 */
const trackSize: Record<FieldSize, string> = {
  sm: "h-5 w-9",
  default: "h-6 w-11",
  lg: "h-8 w-15",
}

const thumbSize: Record<FieldSize, string> = {
  sm: "size-4 data-checked:translate-x-4",
  default: "size-5 data-checked:translate-x-5",
  lg: "size-7 data-checked:translate-x-7",
}

function Switch({
  className,
  size = "default",
  label,
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: FieldSize
  label?: React.ReactNode
}) {
  const control = (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors",
        choiceFocusRing,
        "data-unchecked:bg-grayscale-border-default data-unchecked:hover:bg-grayscale-border-darker",
        "data-checked:bg-primary-surface-default data-checked:hover:bg-primary-surface-darker",
        "aria-invalid:ring-2 aria-invalid:ring-error",
        "data-disabled:cursor-not-allowed data-disabled:bg-grayscale-surface-disabled",
        trackSize[size],
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-grayscale-surface-default shadow-xs transition-transform data-unchecked:translate-x-0",
          thumbSize[size]
        )}
      />
    </SwitchPrimitive.Root>
  )

  if (label == null) return control

  return (
    <label className={choiceLabelVariants({ size })}>
      {control}
      <span>{label}</span>
    </label>
  )
}

export { Switch }
