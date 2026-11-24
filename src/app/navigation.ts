import {
  BookOpenIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  HouseIcon,
  MenuIcon,
  UserIcon,
  UserPlusIcon,
  WalletIcon,
} from "lucide-react"

import type { NavItem } from "@/components/layouts/app-shell"
import type { Role } from "@/features/auth/types"
export type { Role }

export const ROLE_NAV: Record<Role, { main: NavItem[]; utility: NavItem[] }> = {
  wali: {
    main: [
      { label: "Beranda", to: "/wali", icon: HouseIcon, end: true },
      { label: "Jadwal", to: "/wali/jadwal", icon: CalendarIcon },
      { label: "Absensi", to: "/wali/absensi", icon: ClipboardCheckIcon },
      { label: "Tagihan", to: "/wali/tagihan", icon: WalletIcon },
    ],
    utility: [{ label: "Akun", to: "/wali/akun", icon: UserIcon }],
  },
  tutor: {
    main: [
      { label: "Beranda", to: "/tutor", icon: HouseIcon, end: true },
      { label: "Jadwal", to: "/tutor/jadwal", icon: CalendarIcon },
      { label: "Presensi", to: "/tutor/presensi", icon: ClipboardCheckIcon },
      { label: "Riwayat", to: "/tutor/riwayat", icon: BookOpenIcon },
    ],
    utility: [{ label: "Akun", to: "/tutor/akun", icon: UserIcon }],
  },
  pengelola: {
    main: [
      { label: "Beranda", to: "/pengelola", icon: HouseIcon, end: true },
      { label: "Pendaftaran", to: "/pengelola/pendaftaran", icon: UserPlusIcon },
      { label: "Les", to: "/pengelola/les", icon: CalendarIcon },
      { label: "Keuangan", to: "/pengelola/keuangan", icon: WalletIcon },
    ],
    utility: [{ label: "Lainnya", to: "/pengelola/lainnya", icon: MenuIcon }],
  },
}
