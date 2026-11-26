import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/styles"

/*
 * List item · Figma PINTARA → Components → 05 · Data Display → List item
 *
 * Baris daftar ringkas: leading ikon (lingkaran 40px, ikon 20px), judul
 * Subtitle/Bold, deskripsi Caption, lalu elemen kanan (teks/nominal tebal,
 * badge, chevron). Padding 16 / 12, gap 12. Garis pemisah mulai dari x=72
 * dan otomatis hilang pada baris terakhir.
 *
 * <List>
 *   <ListItem icon={<ClipboardCheckIcon />} title="Validasi 2 sesi les"
 *     description="Sesi 19 & 21 Nov belum Anda periksa" chevron
 *     render={<Link to="/presensi" />} />
 * </List>
 */
function List({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="list"
      className={cn("flex flex-col bg-grayscale-surface-default", className)}
      {...props}
    />
  )
}

function ListItem({
  icon,
  title,
  description,
  trailingText,
  badge,
  chevron,
  className,
  render,
  ...props
}: Omit<useRender.ComponentProps<"div">, "title" | "children"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /* Teks/nominal di kanan, mis. "Rp450.000" */
  trailingText?: React.ReactNode
  badge?: React.ReactNode
  chevron?: boolean
}) {
  const element = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "data-slot": "list-item",
        className: cn(
          "relative flex w-full items-center gap-ns-m bg-grayscale-surface-default px-ns-l py-ns-m text-left outline-none",
          "[a&]:transition-colors [a&]:hover:bg-grayscale-surface-subtitle [button&]:transition-colors [button&]:hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter focus-visible:ring-inset",
          className
        ),
        children: (
          <>
            {icon != null && (
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grayscale-surface-subtitle text-grayscale-text-body [&_svg]:size-5"
              >
                {icon}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
              <span className="text-subtitle leading-normal font-bold text-grayscale-text-title">
                {title}
              </span>
              {description != null && (
                <span className="text-caption leading-normal text-grayscale-text-caption">
                  {description}
                </span>
              )}
            </span>
            {(trailingText != null || badge != null || chevron) && (
              <span className="flex shrink-0 items-center gap-ns-s">
                {trailingText != null && (
                  <span className="text-subtitle font-bold whitespace-nowrap text-grayscale-text-title">
                    {trailingText}
                  </span>
                )}
                {badge}
                {chevron && (
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 text-grayscale-text-body"
                  />
                )}
              </span>
            )}
          </>
        ),
      } as React.ComponentProps<"div">,
      props
    ),
  })

  return (
    <li className="group/list-item relative after:absolute after:right-0 after:bottom-0 after:left-18 after:h-px after:bg-grayscale-border-disabled last:after:hidden">
      {element}
    </li>
  )
}

export { List, ListItem }
