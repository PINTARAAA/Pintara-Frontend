import { queryOptions } from "@tanstack/react-query"

import type { StatusOf } from "@/lib/constants/status"
import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import type { DashboardTask, Person } from "@/features/dashboard/api/types"

/*
 * Beranda Wali Murid · Figma PINTARA → UI Screen → Wali Murid → W1 · Beranda
 *
 * TODO(backend): ganti isi getWaliDashboard() dengan
 *   httpClient.get(`/wali/dashboard`, { params: { siswa: studentId } })
 */
export type WaliStudent = Person & { id: string; grade: string }

export type WaliDashboard = {
  parent: { name: string }
  students: WaliStudent[]
  activeStudentId: string
  nextSession: {
    id: string
    subject: string
    start: Date
    end: Date
    tutor: Person & { specialty: string }
  } | null
  tasks: DashboardTask[]
  weekSchedule: { id: string; subject: string; start: Date; end: Date; tutorName: string }[]
  history: {
    id: string
    subject: string
    date: Date
    topic: string
    status: StatusOf<"presensi">
  }[]
  unreadNotifications: number
}

const STUDENTS: WaliStudent[] = [
  { id: "s1", name: "Aisyah Putri", initials: "AP", grade: "Kelas 8" },
  { id: "s2", name: "Fikri Ramadhan", initials: "FR", grade: "Kelas 5" },
]

export async function getWaliDashboard(studentId?: string): Promise<WaliDashboard> {
  assertMockAllowed()
  await delay()

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0]
  const isFirst = student.id === "s1"

  return {
    parent: { name: "Ibu Sari Wulandari" },
    students: STUDENTS,
    activeStudentId: student.id,
    nextSession: {
      id: "les-1",
      subject: isFirst ? "Matematika" : "Bahasa Inggris",
      start: at(1, 16),
      end: at(1, 17, 30),
      tutor: isFirst
        ? { name: "Kak Budi Santoso", initials: "BS", specialty: "Tutor Matematika & IPA" }
        : { name: "Kak Nadia Safitri", initials: "NS", specialty: "Tutor Bahasa Inggris" },
    },
    tasks: isFirst
      ? [
          {
            id: "validasi",
            icon: "clipboard",
            title: "Validasi 2 sesi les",
            description: "Matematika 19 Nov dan IPA 21 Nov",
            to: "/wali/absensi",
          },
          {
            id: "tagihan",
            icon: "wallet",
            title: "Bayar tagihan",
            description: "2 tagihan · 1 lewat jatuh tempo",
            amount: 600_000,
            to: "/wali/tagihan",
          },
        ]
      : [],
    weekSchedule: [
      {
        id: "j1",
        subject: isFirst ? "IPA" : "Bahasa Inggris",
        start: at(3, 16),
        end: at(3, 17, 30),
        tutorName: isFirst ? "Kak Budi Santoso" : "Kak Nadia Safitri",
      },
    ],
    history: [
      {
        id: "r1",
        subject: isFirst ? "IPA" : "Bahasa Inggris",
        date: at(-10, 16),
        topic: isFirst ? "Sistem peredaran darah" : "Simple present tense",
        status: "sudah_divalidasi",
      },
      {
        id: "r2",
        subject: isFirst ? "Matematika" : "Bahasa Inggris",
        date: at(-12, 16),
        topic: isFirst ? "Persamaan linear satu variabel" : "Daily activities",
        status: "sudah_divalidasi",
      },
    ],
    unreadNotifications: isFirst ? 2 : 0,
  }
}

export const waliDashboardQuery = (studentId?: string) =>
  queryOptions({
    queryKey: ["dashboard", "wali", studentId ?? "default"],
    queryFn: () => getWaliDashboard(studentId),
  })
