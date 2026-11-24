import * as React from "react"
import { cn } from "@/lib/utils"

import { fieldControlVariants, type FieldSize } from "@/lib/field-variants"

/*
 * Textarea · Figma PINTARA → Components → 02 · Form Controls → Textarea
 * Gaya sama dengan Input; tinggi minimum sm 80 · md 112 · lg 136, py 12.
 * Counter: <FieldDescription counter="0/500"> di dalam <Field>.
 */
const textareaMinHeight: Record<FieldSize, string> = {
  sm: "min-h-20",
  default: "min-h-28",
  lg: "min-h-34",
}

function Textarea({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"textarea"> & { size?: FieldSize }) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(
        fieldControlVariants({ size }),
        "flex field-sizing-content py-ns-m leading-normal",
        textareaMinHeight[size],
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
