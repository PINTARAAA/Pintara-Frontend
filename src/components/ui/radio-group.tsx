import * as React from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import {
  cn,
  choiceFocusRing,
  choiceLabelVariants,
  type FieldSize,
} from "@/lib/styles"

/*
 * Radio · Figma PINTARA → Components → 02 · Form Controls → Radio
 * Size: sm (20px) · default/Medium (24px) · lg (32px), bulat penuh.
 * Selected: border 2px Primary + titik tengah 10 · 12 · 16px.
 */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-ns-2xs", className)}
      {...props}
    />
  )
}

const radioSize: Record<FieldSize, string> = {
  sm: "size-5 *:size-2.5",
  default: "size-6 *:size-3",
  lg: "size-8 *:size-4",
}

function RadioGroupItem({
  className,
  size = "default",
  label,
  ...props
}: RadioPrimitive.Root.Props & {
  size?: FieldSize
  label?: React.ReactNode
}) {
  const control = (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      data-size={size}
      className={cn(
        "group/radio-group-item peer relative flex aspect-square shrink-0 items-center justify-center rounded-full border border-grayscale-border-default bg-grayscale-surface-default transition-colors hover:border-grayscale-border-darker",
        choiceFocusRing,
        "data-checked:border-2 data-checked:border-primary-surface-default data-checked:hover:border-primary-surface-darker",
        "aria-invalid:border-error",
        "data-disabled:cursor-not-allowed data-disabled:border-grayscale-surface-disabled data-disabled:bg-grayscale-surface-disabled",
        radioSize[size],
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="rounded-full bg-primary-surface-default group-hover/radio-group-item:bg-primary-surface-darker group-data-disabled/radio-group-item:bg-grayscale-text-disabled"
      />
    </RadioPrimitive.Root>
  )

  if (label == null) return control

  return (
    <label className={choiceLabelVariants({ size })}>
      {control}
      <span>{label}</span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem }
