import type { LucideIcon } from "lucide-react"
import { NavLink, Outlet, useMatch } from "react-router"

import {
  BottomNavigation,
  BottomNavigationItem,
} from "@/components/ui/bottom-navigation"

/*
 * BottomNavLayout · layout route untuk layar tab tiap peran
 * (Beranda, Jadwal, Tagihan, …). Halaman tab dirender di <Outlet />;
 * BottomNavigation menempel di bawah dan tidak ikut di-render ulang saat
 * berpindah tab. Layar detail/formulir berada di luar layout ini sehingga
 * tampil tanpa bottom navigation, sesuai Figma.
 */
type BottomNavItem = {
  label: string
  to: string
  icon: LucideIcon
  /* true = aktif hanya bila URL sama persis (untuk menu Beranda/index) */
  end?: boolean
}

function NavItem({ item }: { item: BottomNavItem }) {
  const active = useMatch({ path: item.to, end: item.end ?? false }) != null
  const Icon = item.icon
  return (
    <BottomNavigationItem
      icon={<Icon />}
      label={item.label}
      active={active}
      render={<NavLink to={item.to} end={item.end} />}
    />
  )
}

function BottomNavLayout({ items }: { items: BottomNavItem[] }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <BottomNavigation className="sticky bottom-0 z-20">
        {items.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </BottomNavigation>
    </div>
  )
}

export { BottomNavLayout, type BottomNavItem }
