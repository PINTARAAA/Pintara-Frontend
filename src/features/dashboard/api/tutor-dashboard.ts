import { queryOptions } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import type { DashboardTask, Person } from "@/features/dashboard/api/types"

/*
 * Beranda Tutor · Figma PINTARA → UI Screen → Tutor → T1 · Beranda
 *
 * TODO(backend): ganti isi getTutorDashboard() dengan
 *   httpClient.get("/tutor/dashboard")
 */
export type TutorDashboard = {
  tutor: { name: string }
  nextSession: {
    id: string
    subject: string
    start: Date
    end: Date
    student: Person & { grade: string }
    address: string
  } | null
  tasks: DashboardTask[]
  upcoming: { id: string; subject: string; studentName: string; start: Date; end: Date }[]
  recap: {
    month: string
    held: number
    validated: number
    waitingParent: number
    disputed: number
  }
  unreadNotifications: number
}

export async function getTutorDashboard(): Promise<TutorDashboard> {
  assertMockAllowed()
  await delay()

  const now = new Date()
  /* Sesi berikutnya: hari ini 18.30 bila masih sempat, selain itu besok 16.00 */
  const start = now.getHours() < 17 ? at(0, 18, 30) : at(1, 16)

  return {
    tutor: { name: "Kak Budi Santoso" },
    nextSession: {
      id: "les-t1",
      subject: "IPA",
      start,
      end: new Date(start.getTime() + 90 * 60_000),
      student: { name: "Rizky Ananda", initials: "RA", grade: "Kelas 10" },
      address: "Jl. Soekarno-Hatta No. 45, Bangkalan",
    },
    tasks: [
      {
        id: "presensi",
        icon: "clipboard",
        title: "Isi presensi 1 sesi",
        description: `IPA · Dimas Pratama · ${format(at(-1, 16), "EEEE, d MMM", { locale: localeId })}`,
        to: "/tutor/presensi",
      },
      {
        id: "keberatan",
        icon: "alert",
        title: "1 presensi dikeberatan wali",
        description: "Matematika · Aisyah Putri · 19 Nov",
        to: "/tutor/presensi",
      },
    ],
    upcoming: [
      { id: "u1", subject: "Matematika", studentName: "Aisyah Putri", start: at(2, 16), end: at(2, 17, 30) },
      { id: "u2", subject: "IPA", studentName: "Aisyah Putri", start: at(3, 16), end: at(3, 17, 30) },
    ],
    recap: {
      month: format(now, "MMMM", { locale: localeId }),
      held: 14,
      validated: 11,
      waitingParent: 2,
      disputed: 1,
    },
    unreadNotifications: 1,
  }
}

export const tutorDashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard", "tutor"],
    queryFn: getTutorDashboard,
  })
