import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { at } from "@/lib/data/mock"
import type {
  PengelolaDashboardData,
  TutorDashboardData,
  WaliDashboardData,
  WaliStudent,
} from "@/types/dashboard"

/* Anak-anak wali (data contoh), dipakai juga oleh layar Jadwal Les */
export const STUDENTS: WaliStudent[] = [
  { id: "s1", name: "Aisyah Putri", initials: "AP", grade: "Kelas 8" },
  { id: "s2", name: "Fikri Ramadhan", initials: "FR", grade: "Kelas 5" },
]

/* ---------- Beranda Pengelola LBB · P1 · Beranda ---------- */

export function pengelolaDashboardData(): PengelolaDashboardData {
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
        actionLabel: "Verifikasi",
      },
      {
        id: "cocokkan",
        icon: "users",
        title: "Cocokkan tutor",
        description: "Siswa terverifikasi belum punya tutor",
        count: 2,
        to: "/pengelola/les",
        actionLabel: "Cocokkan",
      },
      {
        id: "keberatan",
        icon: "alert",
        title: "Tinjau keberatan presensi",
        description: "Dari wali murid",
        count: 1,
        to: "/pengelola/presensi",
        actionLabel: "Tinjau",
      },
      {
        id: "final",
        icon: "clipboard",
        title: "Verifikasi final presensi",
        description: "Siap dihitung ke rekap honor",
        count: 18,
        to: "/pengelola/presensi",
        actionLabel: "Verifikasi",
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

/* ---------- Beranda Tutor · T1 · Beranda ---------- */

export function tutorDashboardData(): TutorDashboardData {
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
      {
        id: "u1",
        subject: "Matematika",
        studentName: "Aisyah Putri",
        start: at(2, 16),
        end: at(2, 17, 30),
      },
      {
        id: "u2",
        subject: "IPA",
        studentName: "Aisyah Putri",
        start: at(3, 16),
        end: at(3, 17, 30),
      },
    ],
    recap: {
      month: format(now, "MMMM", { locale: localeId }),
      held: 14,
      validated: 11,
      waitingParent: 2,
      disputed: 1,
    },
  }
}

/* ---------- Beranda Wali Murid · W1 · Beranda ---------- */

export function waliDashboardData(studentId?: string): WaliDashboardData {
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
        ? {
            name: "Kak Budi Santoso",
            initials: "BS",
            specialty: "Tutor Matematika & IPA",
          }
        : {
            name: "Kak Nadia Safitri",
            initials: "NS",
            specialty: "Tutor Bahasa Inggris",
          },
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
