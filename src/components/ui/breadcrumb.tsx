import * as React from "react"
import { useRender } from "@base-ui/react/use-render"
import { mergeProps } from "@base-ui/react/merge-props"

import { cn } from "@/lib/styles/cn"

/*
 * Breadcrumb · Figma PINTARA → Components → 04 · Navigation → Breadcrumb
 *
 * Satu ukuran, tinggi item 32px, 2–4 level. Level sebelumnya = tautan
 * (Primary/Text/primary, hover Grayscale/Surface/subtitle); level terakhir =
 * halaman aktif (tebal, Grayscale/Text/title). Separator default "/".
 *
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem><BreadcrumbLink render={<Link to="/" />}>Beranda</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbPage>Pendaftaran</BreadcrumbPage></BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 */
function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="Jejak halaman" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-ns-xs text-subtitle break-words",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center", className)}
      {...props}
    />
  )
}

const itemBase =
  "inline-flex h-8 items-center rounded-md px-ns-2xs whitespace-nowrap"

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        "data-slot": "breadcrumb-link",
        className: cn(
          itemBase,
          "text-primary-text-primary transition-colors outline-none hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter",
          className
        ),
      } as React.ComponentProps<"a">,
      props
    ),
  })
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(itemBase, "font-bold text-grayscale-text-title", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("px-ns-xs text-grayscale-text-caption", className)}
      {...props}
    >
      {children ?? "/"}
    </li>
  )
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
