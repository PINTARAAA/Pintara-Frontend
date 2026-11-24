"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import pintaraLogo from "@/assets/pintara-logo.png"
import { cn } from "@/lib/utils"

/*
 * Sidebar · Figma PINTARA → Components → 04 · Navigation → Sidebar
 *
 * State Open (264px) dan Toggle/diciutkan (80px). Padding 16 / 12, gap 16,
 * border Grayscale/Surface/disabled. Item 44px, radius 8, ikon 20px, teks 13;
 * item aktif = Primary/Surface/subtitle + teks tebal Primary/Text/primary.
 *
 * <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
 *   <SidebarBrand />
 *   <SidebarNav aria-label="Menu utama" className="flex-1">
 *     <SidebarNavItem icon={<HouseIcon />} label="Beranda" active render={<Link to="/" />} />
 *   </SidebarNav>
 *   <SidebarNav aria-label="Menu lainnya">…</SidebarNav>
 *   <SidebarToggle />
 * </Sidebar>
 */

type SidebarContextValue = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("Komponen Sidebar* harus berada di dalam <Sidebar>")
  return ctx
}

function Sidebar({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  className,
  children,
  ...props
}: React.ComponentProps<"aside"> & {
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}) {
  const [inner, setInner] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? inner
  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (collapsedProp === undefined) setInner(next)
      onCollapsedChange?.(next)
    },
    [collapsedProp, onCollapsedChange]
  )

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        data-slot="sidebar"
        data-collapsed={collapsed || undefined}
        className={cn(
          "group/sidebar flex h-full shrink-0 flex-col gap-ns-l border-r border-grayscale-surface-disabled bg-grayscale-surface-default px-ns-m py-ns-l transition-[width] duration-200",
          collapsed ? "w-20" : "w-66",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  )
}

/* Logo Pintara 48px + nama produk (Headline/Bold) */
function SidebarBrand({
  name = "Pintara",
  logo = pintaraLogo,
  className,
  ...props
}: React.ComponentProps<"div"> & { name?: string; logo?: string }) {
  const { collapsed } = useSidebar()
  return (
    <div
      data-slot="sidebar-brand"
      className={cn(
        "flex h-14 shrink-0 items-center gap-ns-s overflow-hidden",
        collapsed ? "justify-center" : "pl-ns-2xs",
        className
      )}
      {...props}
    >
      <img
        src={logo}
        alt={collapsed ? name : ""}
        className="size-12 shrink-0 object-cover"
      />
      {!collapsed && (
        <span className="text-headline font-bold whitespace-nowrap text-grayscale-text-title">
          {name}
        </span>
      )}
    </div>
  )
}

function SidebarNav({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="sidebar-nav"
      className={cn("flex min-h-0 flex-col gap-ns-2xs overflow-x-hidden overflow-y-auto", className)}
      {...props}
    />
  )
}

function SidebarNavItem({
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
  const { collapsed } = useSidebar()
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        "data-slot": "sidebar-nav-item",
        "data-active": active || undefined,
        "aria-current": active ? "page" : undefined,
        "aria-label": collapsed ? label : undefined,
        title: collapsed ? label : undefined,
        className: cn(
          "flex h-11 shrink-0 items-center gap-ns-m rounded-md text-subtitle font-normal text-grayscale-text-body transition-colors outline-none",
          "hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter",
          "data-active:bg-primary-surface-subtitle data-active:font-bold data-active:text-primary-text-primary",
          "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-grayscale-text-body data-active:[&_svg]:text-primary-text-primary",
          collapsed ? "w-full justify-center px-0" : "w-full px-ns-m",
          className
        ),
        children: (
          <>
            {icon}
            {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
          </>
        ),
      } as React.ComponentProps<"a">,
      props
    ),
  })
}

/* Kontrol bawah: "Ciutkan sidebar" / ikon buka */
function SidebarToggle({
  className,
  collapseLabel = "Ciutkan sidebar",
  expandLabel = "Buka sidebar",
  ...props
}: React.ComponentProps<"button"> & {
  collapseLabel?: string
  expandLabel?: string
}) {
  const { collapsed, setCollapsed } = useSidebar()
  const Icon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon
  return (
    <div
      data-slot="sidebar-toggle"
      className="shrink-0 border-t border-grayscale-surface-disabled pt-ns-m"
    >
      <button
        type="button"
        aria-label={collapsed ? expandLabel : collapseLabel}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "group/toggle flex h-11 w-full items-center gap-ns-2xs text-subtitle text-grayscale-text-body outline-none",
          collapsed ? "justify-center" : "pl-ns-2xs",
          className
        )}
        {...props}
      >
        <span className="flex size-9 items-center justify-center rounded-(--comp-radius-sm) text-primary-surface-default transition-colors group-hover/toggle:bg-primary-surface-subtitle group-focus-visible/toggle:ring-2 group-focus-visible/toggle:ring-primary-border-lighter">
          <Icon className="size-5" />
        </span>
        {!collapsed && <span className="whitespace-nowrap">{collapseLabel}</span>}
      </button>
    </div>
  )
}

export { Sidebar, SidebarBrand, SidebarNav, SidebarNavItem, SidebarToggle }
