import { queryOptions } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import type { DashboardTask } from "@/features/dashboard/api/types"

/*
 * Beranda Pengelola LBB · Figma PINTARA → UI Screen → Pengelola → P1 · Beranda
 *
 * TODO(backend): ganti isi getPengelolaDashboard() dengan
 *   httpClient.get("/pengelola/dashboard")
 */
export type PengelolaDashboard = {
  admin: { name: string }
  today: {
    date: Date
    sessions: number
    tutorsOnDuty: number
    attendanceSubmitted: number
    missingYesterday: number
  }
  tasks: DashboardTask[]
  billing: {
    month: string
    paidAmount: number
    totalAmount: number
    invoices: number
    dueDate: Date
    lunas: number
    sebagian: number
    belumBayar: number
  }
  unreadNotifications: number
}

export async function getPengelolaDashboard(): Promise<PengelolaDashboard> {
  assertMockAllowed()
  await delay()

  return {
    admin: { name: "Kak Ila" },
    today: {
      date: new Date(),
      sessions: 18,
      tutorsOnDuty: 12,
      attendanceSubmitted: 3,
      missingYesterday: 2,
    },
    tasks: [
      {
        id: "verifikasi",
        icon: "user-plus",
        title: "Verifikasi pendaftaran",
        description: "Terlama menunggu 2 hari",
        count: 3,
        to: "/pengelola/pendaftaran",
      },
      {
        id: "cocokkan",
        icon: "users",
        title: "Cocokkan tutor",
        description: "Siswa terverifikasi belum punya tutor",
        count: 2,
        to: "/pengelola/les",
      },
      {
        id: "keberatan",
        icon: "alert",
        title: "Tinjau keberatan presensi",
        description: "Dari wali murid",
        count: 1,
        to: "/pengelola/les",
      },
      {
        id: "final",
        icon: "clipboard",
        title: "Verifikasi final presensi",
        description: "Siap dihitung ke rekap honor",
        count: 18,
        to: "/pengelola/les",
      },
    ],
    billing: {
      month: format(new Date(), "MMMM", { locale: localeId }),
      paidAmount: 38_200_000,
      totalAmount: 45_000_000,
      invoices: 84,
      dueDate: at(16, 0),
      lunas: 70,
      sebagian: 6,
      belumBayar: 8,
    },
    unreadNotifications: 3,
  }
}

export const pengelolaDashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard", "pengelola"],
    queryFn: getPengelolaDashboard,
  })
