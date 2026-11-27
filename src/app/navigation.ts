import {
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  HouseIcon,
  LockIcon,
  MenuIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import type { NavItem, SidebarGroup } from "@/components"
import type { Role } from "@/types/auth"
export type { Role }

/*
 * Menu tiap peran: `main` + `utility` = bottom navigation mobile dan sidebar
 * desktop, sekaligus sumber route tab. Opsional `sidebarExtra` = menu yang
 * hanya tampil di sidebar desktop (route-nya didaftarkan terpisah), disisipkan
 * di akhir grup masing-masing.
 */
export const ROLE_NAV: Record<
  Role,
  {
    main: NavItem[]
    utility: NavItem[]
    sidebarExtra?: { main?: NavItem[]; utility?: NavItem[] }
  }
> = {
  wali: {
    main: [
      { label: "Beranda", to: "/wali", icon: HouseIcon, end: true },
      { label: "Jadwal", to: "/wali/jadwal", icon: CalendarIcon },
      { label: "Absensi", to: "/wali/absensi", icon: ClipboardCheckIcon },
      { label: "Tagihan", to: "/wali/tagihan", icon: WalletIcon },
    ],
    utility: [{ label: "Akun", to: "/wali/akun", icon: UserIcon }],
    /* Figma → Sidebar (Wali / Beranda (Desktop)): Riwayat les + Notifikasi */
    sidebarExtra: {
      main: [{ label: "Riwayat les", to: "/wali/riwayat", icon: BookOpenIcon }],
      utility: [{ label: "Notifikasi", to: "/wali/notifikasi", icon: BellIcon }],
    },
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

/*
 * Sidebar desktop berkelompok · Figma PINTARA → Components → 04 · Navigation
 * → Sidebar / Pengelola. Menggabungkan bottom nav dan menu "Lainnya" versi
 * mobile ke dalam satu sidebar. Peran tanpa entri memakai ROLE_NAV apa adanya.
 * Bottom navigation mobile tetap memakai ROLE_NAV.
 */
export const ROLE_SIDEBAR: Partial<
  Record<
    Role,
    { groups: SidebarGroup[]; utility: NavItem[]; logoutDescription: string }
  >
> = {
  pengelola: {
    logoutDescription:
      "Anda perlu masuk lagi dengan email/username dan password untuk mengelola data LBB.",
    groups: [
      {
        items: [{ label: "Beranda", to: "/pengelola", icon: HouseIcon, end: true }],
      },
      {
        label: "Operasional",
        items: [
          { label: "Pendaftaran", to: "/pengelola/pendaftaran", icon: UserPlusIcon },
          { label: "Les", to: "/pengelola/les", icon: CalendarIcon },
          { label: "Presensi", to: "/pengelola/presensi", icon: ClipboardCheckIcon },
          { label: "Keuangan", to: "/pengelola/keuangan", icon: WalletIcon },
        ],
      },
      {
        label: "Data master",
        items: [
          { label: "Data tutor", to: "/pengelola/tutor", icon: GraduationCapIcon },
          { label: "Data siswa", to: "/pengelola/siswa", icon: UsersIcon },
          { label: "Manajemen akun", to: "/pengelola/akun", icon: LockIcon },
        ],
      },
      {
        label: "Laporan",
        items: [
          { label: "Rekap & riwayat les", to: "/pengelola/riwayat", icon: BookOpenIcon },
          {
            label: "Laporan keuangan",
            to: "/pengelola/laporan-keuangan",
            icon: FileTextIcon,
          },
          {
            label: "Riwayat notifikasi",
            to: "/pengelola/riwayat-notifikasi",
            icon: MessageCircleIcon,
          },
        ],
      },
    ],
    utility: [
      { label: "Notifikasi", to: "/pengelola/notifikasi", icon: BellIcon },
      {
        label: "Pengaturan notifikasi",
        to: "/pengelola/pengaturan-notifikasi",
        icon: SettingsIcon,
      },
    ],
  },
}
