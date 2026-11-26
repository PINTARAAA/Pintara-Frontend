import * as React from "react"
import { cn } from "@/lib/styles"

/*
 * Label · mengikuti "Label row" pada Input/Textarea Figma PINTARA:
 * Subtitle/Bold (13px), Grayscale/Text/title. Di dalam <Field size="lg">
 * otomatis menjadi Body/Bold (16px).
 */
function Label({
  className,
  required,
  children,
  ...props
}: React.ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-subtitle leading-normal font-bold text-grayscale-text-title select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 group-data-[size=lg]/field:text-body peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="font-normal text-error">
          *
        </span>
      )}
    </label>
  )
}

export { Label }
