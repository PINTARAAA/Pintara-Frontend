import type { LucideIcon } from "lucide-react"
import { NavLink, Outlet, useMatch, useMatches } from "react-router"

import {
  BottomNavigation,
  BottomNavigationItem,
} from "@/components/ui/bottom-navigation"
import {
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarNavItem,
  SidebarToggle,
} from "@/components/ui/sidebar"

/*
 * AppShell · layout route untuk area satu peran (Wali Murid, Tutor,
 * Pengelola). Halaman dirender di <Outlet />.
 *
 * Mobile (< lg, sesuai Figma): BottomNavigation menempel di bawah, berisi
 *   menu utama + menu utilitas (Akun/Lainnya). Layar detail/formulir
 *   menyembunyikannya lewat `handle: { hideBottomNav: true }` pada route.
 * Desktop (≥ lg): Sidebar di kiri (Figma → Components → Sidebar): menu
 *   utama di atas, menu utilitas di grup bawah, bisa diciutkan. Sidebar
 *   tetap tampil di layar detail.
 *
 * Navigasi tidak ikut di-render ulang saat berpindah halaman.
 */
type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  /* true = aktif hanya bila URL sama persis (untuk Beranda/index) */
  end?: boolean
}

type RouteHandle = { hideBottomNav?: boolean }

function useIsActive(item: NavItem) {
  return useMatch({ path: item.to, end: item.end ?? false }) != null
}

function BottomItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <BottomNavigationItem
      icon={<Icon />}
      label={item.label}
      active={useIsActive(item)}
      render={<NavLink to={item.to} end={item.end} />}
    />
  )
}

function SideItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <SidebarNavItem
      icon={<Icon />}
      label={item.label}
      active={useIsActive(item)}
      render={<NavLink to={item.to} end={item.end} />}
    />
  )
}

function AppShell({
  items,
  utilityItems = [],
}: {
  /* Menu utama (Beranda, Jadwal, …) */
  items: NavItem[]
  /* Menu utilitas (Akun, Lainnya): grup bawah Sidebar, akhir BottomNavigation */
  utilityItems?: NavItem[]
}) {
  const hideBottomNav = useMatches().some(
    (match) => (match.handle as RouteHandle | undefined)?.hideBottomNav
  )

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <SidebarBrand />
        <SidebarNav aria-label="Menu utama" className="flex-1">
          {items.map((item) => (
            <SideItem key={item.to} item={item} />
          ))}
        </SidebarNav>
        {utilityItems.length > 0 && (
          <SidebarNav aria-label="Menu lainnya">
            {utilityItems.map((item) => (
              <SideItem key={item.to} item={item} />
            ))}
          </SidebarNav>
        )}
        <SidebarToggle />
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>

      {!hideBottomNav && (
        <BottomNavigation className="sticky bottom-0 z-20 lg:hidden">
          {[...items, ...utilityItems].map((item) => (
            <BottomItem key={item.to} item={item} />
          ))}
        </BottomNavigation>
      )}
    </div>
  )
}

export { AppShell, type NavItem }
