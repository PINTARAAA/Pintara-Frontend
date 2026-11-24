import { queryOptions } from "@tanstack/react-query"
import {
  previousFriday,
  previousThursday,
  previousWednesday,
  setHours,
  setMinutes,
  startOfDay,
  subWeeks,
} from "date-fns"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"
import { STUDENTS } from "@/features/dashboard/api/wali-dashboard"
import type { StatusOf } from "@/lib/constants/status"

/*
 * Validasi Absensi & Ulasan · Figma PINTARA → UI Screen → Wali Murid → W5
 *
 * TODO(backend):
 *   getAttendance()          → httpClient.get("/wali/presensi")
 *   getSession(id)           → httpClient.get(`/wali/presensi/${id}`)
 *   approveSession(id)       → httpClient.post(`/wali/presensi/${id}/setujui`)
 *   submitObjection(id, …)   → httpClient.post(`/wali/presensi/${id}/keberatan`, …)
 *   submitReview(id, …)      → httpClient.post(`/wali/presensi/${id}/ulasan`, …)
 *
 * Selama backend belum ada (mode development) data disimpan di memori:
 * menyetujui, mengajukan keberatan dan memberi ulasan langsung mengubah
 * daftar "Perlu Validasi" / "Riwayat" sampai halaman dimuat ulang.
 */
export type Attendance = "Hadir" | "Izin" | "Sakit" | "Tidak hadir"

export type SessionStatus = Extract<
  StatusOf<"presensi">,
  "belum_divalidasi" | "sudah_divalidasi" | "keberatan"
>

export type AttendanceSession = {
  id: string
  studentId: string
  studentName: string
  subject: string
  start: Date
  end: Date
  tutor: { name: string; initials: string }
  tutorAttendance: Attendance
  studentAttendance: Attendance
  topic: string
  notes: string
  attachments: string[]
  status: SessionStatus
  validatedAt?: Date
  objection?: { reason: string; submittedAt: Date }
  review?: { rating: number; comment: string; submittedAt: Date }
}

/* ---------- Data contoh ---------- */

function slot(day: Date, hour: number, minutes = 90) {
  const start = setMinutes(setHours(startOfDay(day), hour), 0)
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const today = new Date()
const lastWed = previousWednesday(today)
const lastFri = previousFriday(today)
const lastThu = previousThursday(today)

const BUDI = { name: "Kak Budi Santoso", initials: "BS" }
const NADIA = { name: "Kak Nadia Safitri", initials: "NS" }
const aisyah = { studentId: "s1", studentName: "Aisyah Putri" }
const fikri = { studentId: "s2", studentName: "Fikri Ramadhan" }

const sessions: AttendanceSession[] = [
  {
    id: "ses-ipa-1",
    ...aisyah,
    subject: "IPA",
    ...slot(lastFri, 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Sistem pencernaan manusia",
    notes:
      "Aisyah aktif bertanya dan mampu menjelaskan urutan organ pencernaan. Perlu mengulang fungsi enzim.",
    attachments: ["foto_sesi_ipa_1.jpg"],
    status: "belum_divalidasi",
  },
  {
    id: "ses-mtk-1",
    ...aisyah,
    subject: "Matematika",
    ...slot(lastWed, 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Persamaan linear satu variabel",
    notes:
      "Aisyah sudah memahami konsep dasar dan mampu menyelesaikan 8 dari 10 soal latihan. Perlu latihan tambahan pada soal cerita.",
    attachments: ["foto_sesi_mtk_1.jpg", "foto_sesi_mtk_2.jpg"],
    status: "belum_divalidasi",
  },
  {
    id: "ses-ipa-0",
    ...aisyah,
    subject: "IPA",
    ...slot(subWeeks(lastFri, 1), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Sistem peredaran darah",
    notes: "Materi tuntas. Aisyah mengerjakan 10 soal dengan 9 benar.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastFri, 1),
    review: {
      rating: 5,
      comment: "Penjelasan Kak Budi mudah dipahami.",
      submittedAt: subWeeks(lastFri, 1),
    },
  },
  {
    id: "ses-mtk-0",
    ...aisyah,
    subject: "Matematika",
    ...slot(subWeeks(lastWed, 1), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Bentuk aljabar",
    notes: "Aisyah perlu latihan tambahan pada operasi pecahan aljabar.",
    attachments: ["foto_sesi_mtk_0.jpg"],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastWed, 1),
  },
  {
    id: "ses-bing-0",
    ...fikri,
    subject: "Bahasa Inggris",
    ...slot(lastThu, 15),
    tutor: NADIA,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Simple present tense",
    notes: "Fikri sudah bisa membuat kalimat positif dan negatif.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: lastThu,
  },
]

/* ---------- Daftar ---------- */

export type AttendanceOverview = {
  pending: AttendanceSession[]
  history: AttendanceSession[]
  /* Lebih dari satu anak → nama anak ditampilkan pada daftar */
  multipleStudents: boolean
  unreadNotifications: number
}

const byNewest = (a: AttendanceSession, b: AttendanceSession) =>
  b.start.getTime() - a.start.getTime()

export async function getAttendance(): Promise<AttendanceOverview> {
  assertMockAllowed()
  await delay()

  return {
    pending: sessions
      .filter((s) => s.status === "belum_divalidasi")
      .sort(byNewest),
    history: sessions
      .filter((s) => s.status !== "belum_divalidasi")
      .sort(byNewest),
    multipleStudents: STUDENTS.length > 1,
    unreadNotifications: 2,
  }
}

export const attendanceQuery = () =>
  queryOptions({
    queryKey: ["absensi", "daftar"],
    queryFn: getAttendance,
  })

/* ---------- Detail & aksi ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Sesi tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

function find(id: string) {
  const session = sessions.find((s) => s.id === id)
  if (!session) throw new NotFoundError()
  return session
}

export async function getSession(id: string): Promise<AttendanceSession> {
  assertMockAllowed()
  await delay(300)
  return { ...find(id) }
}

export const sessionQuery = (id: string) =>
  queryOptions({
    queryKey: ["absensi", "sesi", id],
    queryFn: () => getSession(id),
  })

function assertOnline() {
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
}

export async function approveSession(id: string) {
  assertMockAllowed()
  await delay(600)
  assertOnline()
  const session = find(id)
  session.status = "sudah_divalidasi"
  session.validatedAt = new Date()
  return { ...session }
}

export async function submitObjection(id: string, reason: string) {
  assertMockAllowed()
  await delay(800)
  assertOnline()
  const session = find(id)
  session.status = "keberatan"
  session.objection = { reason: reason.trim(), submittedAt: new Date() }
  return { ...session }
}

export async function submitReview(
  id: string,
  review: { rating: number; comment: string }
) {
  assertMockAllowed()
  await delay(600)
  assertOnline()
  const session = find(id)
  session.review = {
    rating: review.rating,
    comment: review.comment.trim(),
    submittedAt: new Date(),
  }
  return { ...session }
}
