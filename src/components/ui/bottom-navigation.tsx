import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

/*
 * Bottom navigation · Figma PINTARA → Components → 04 · Navigation
 *
 * Navigasi utama mobile, menempel di bawah layar (biasanya 5 item per peran:
 * Wali Murid, Tutor, Pengelola). Item 72px: indikator pil (px 16, py 4) berisi
 * ikon 24px + label Caption. Item aktif = indikator Primary/Surface/subtitle,
 * label tebal Primary/Text/primary.
 *
 * <BottomNavigation>
 *   <BottomNavigationItem icon={<HouseIcon />} label="Beranda" active render={<Link to="/" />} />
 *   …
 * </BottomNavigation>
 */
function BottomNavigation({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Navigasi utama"
      data-slot="bottom-navigation"
      className={cn(
        "flex w-full items-start justify-around border-t border-grayscale-border-disabled bg-grayscale-surface-default px-ns-s pb-[max(var(--spacing-ns-2xs),env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    />
  )
}

function BottomNavigationItem({
  icon,
  label,
  active,
  className,
  render,
  ...props
}: Omit<useRender.ComponentProps<"a">, "children"> & {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        "data-slot": "bottom-navigation-item",
        "data-active": active || undefined,
        "aria-current": active ? "page" : undefined,
        className: cn(
          "group/bottom-nav flex w-18 flex-col items-center justify-center gap-ns-2xs px-ns-2xs py-ns-s text-caption leading-normal font-normal whitespace-nowrap text-grayscale-text-caption outline-none",
          "data-active:font-bold data-active:text-primary-text-primary",
          className
        ),
        children: (
          <>
            <span className="flex items-center rounded-full px-ns-l py-ns-2xs text-grayscale-text-body transition-colors group-hover/bottom-nav:bg-grayscale-surface-subtitle group-focus-visible/bottom-nav:ring-2 group-focus-visible/bottom-nav:ring-primary-border-lighter group-data-active/bottom-nav:bg-primary-surface-subtitle [&_svg]:size-6 [&_svg]:shrink-0">
              {icon}
            </span>
            <span>{label}</span>
          </>
        ),
      } as React.ComponentProps<"a">,
      props
    ),
  })
}

export { BottomNavigation, BottomNavigationItem }
