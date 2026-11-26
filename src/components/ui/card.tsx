import * as React from "react"

import { cn } from "@/lib/styles"

/*
 * Card · Figma PINTARA → Components → 05 · Data Display → Card
 *
 * Kontainer: Grayscale/Surface/default, border Grayscale/Border/default,
 * radius 12. Size default = padding 24, gap 16 (halaman detail);
 * compact = padding 16, gap 12 (layar mobile padat).
 * Struktur: Header (judul Body/Bold + deskripsi) · Body · Footer (garis
 * pemisah + teks Caption).
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "compact" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-gap) rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-(--card-padding) text-subtitle text-grayscale-text-body",
        "[--card-gap:--spacing(4)] [--card-padding:--spacing(6)] data-[size=compact]:[--card-gap:--spacing(3)] data-[size=compact]:[--card-padding:--spacing(4)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-ns-s has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "text-body leading-normal font-bold text-grayscale-text-title",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-subtitle leading-normal text-grayscale-text-subtitle",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-col gap-ns-m leading-normal", className)}
      {...props}
    />
  )
}

/* Footer: garis pemisah Grayscale/Border/default + teks Caption */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-ns-s border-t border-grayscale-border-default pt-(--card-gap) text-caption leading-normal text-grayscale-text-caption",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
