import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import {
  cn,
  fieldControlVariants,
  fieldHeight,
  type FieldSize,
} from "@/lib/styles"

/*
 * Input · Figma PINTARA → Components → 02 · Form Controls → Input
 * Size: sm · default (Medium) · lg. Untuk label, helper text, dan pesan
 * error, bungkus dengan <Field> (lihat field.tsx).
 */
function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: FieldSize }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        fieldControlVariants({ size }),
        fieldHeight[size],
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-subtitle file:font-bold file:text-grayscale-text-body",
        className
      )}
      {...props}
    />
  )
}

export { Input }
