import * as React from "react"
import { cn } from "@/lib/styles/cn"

import { Label } from "@/components/ui/label"
import type { FieldSize } from "@/lib/styles/field-variants"

/*
 * Field · pembungkus Label + kontrol + Helper row, sesuai struktur Input &
 * Textarea di Figma PINTARA. Jarak antar-baris mengikuti Token Komponen
 * "Spacing" (sm 4 · md 8 · lg 12).
 *
 * <Field size="default">
 *   <FieldLabel htmlFor="email" required>Email</FieldLabel>
 *   <Input id="email" aria-invalid={!!error} />
 *   {error
 *     ? <FieldError>{error}</FieldError>
 *     : <FieldDescription>Gunakan email aktif Anda.</FieldDescription>}
 * </Field>
 */
function Field({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: FieldSize }) {
  return (
    <div
      data-slot="field"
      data-size={size}
      className={cn(
        "group/field flex w-full flex-col",
        size === "sm" && "gap-(--comp-gap-sm)",
        size === "default" && "gap-(--comp-gap-md)",
        size === "lg" && "gap-(--comp-gap-lg)",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel(props: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" {...props} />
}

/* Helper text (Caption/Regular, Grayscale/Text/caption) + counter opsional */
function FieldDescription({
  className,
  counter,
  children,
  ...props
}: React.ComponentProps<"p"> & { counter?: React.ReactNode }) {
  return (
    <div
      data-slot="field-description"
      className="flex w-full items-start gap-ns-s text-caption leading-normal text-grayscale-text-caption"
    >
      <p className={cn("min-w-0 flex-1", className)} {...props}>
        {children}
      </p>
      {counter != null && (
        <span className="shrink-0 text-right whitespace-nowrap tabular-nums">
          {counter}
        </span>
      )}
    </div>
  )
}

/* Pesan error (Caption/Regular, Semantic/Error) + counter opsional */
function FieldError({
  className,
  counter,
  children,
  ...props
}: React.ComponentProps<"p"> & { counter?: React.ReactNode }) {
  return (
    <div
      data-slot="field-error"
      className="flex w-full items-start gap-ns-s text-caption leading-normal"
    >
      <p role="alert" className={cn("min-w-0 flex-1 text-error", className)} {...props}>
        {children}
      </p>
      {counter != null && (
        <span className="shrink-0 text-right whitespace-nowrap text-grayscale-text-caption tabular-nums">
          {counter}
        </span>
      )}
    </div>
  )
}

export { Field, FieldLabel, FieldDescription, FieldError }
