import { queryOptions } from "@tanstack/react-query"
import {
  previousFriday,
  previousThursday,
  previousWednesday,
  endOfMonth,
  isSameMonth,
  setHours,
  setMinutes,
  startOfDay,
  subWeeks,
} from "date-fns"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"
import { STUDENTS } from "@/features/dashboard/api/wali-dashboard"
import { countUpcomingSessions } from "@/features/jadwal/api/jadwal"
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
  /* Diisi bila sesi tidak terlaksana (tidak perlu divalidasi), mis. "siswa sakit" */
  cancelReason?: string
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
      submittedAt: setMinutes(setHours(startOfDay(subWeeks(lastFri, 1)), 19), 2),
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
    id: "ses-ipa-x",
    ...aisyah,
    subject: "IPA",
    ...slot(subWeeks(lastFri, 2), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Sakit",
    topic: "Sistem gerak manusia",
    notes: "",
    attachments: [],
    status: "sudah_divalidasi",
    cancelReason: "siswa sakit",
  },
  {
    id: "ses-mtk-x",
    ...aisyah,
    subject: "Matematika",
    ...slot(subWeeks(lastWed, 2), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Bilangan berpangkat",
    notes: "Aisyah lancar menyelesaikan operasi bilangan berpangkat positif.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastWed, 2),
  },
  {
    id: "ses-ipa-y",
    ...aisyah,
    subject: "IPA",
    ...slot(subWeeks(lastFri, 3), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Klasifikasi makhluk hidup",
    notes: "Materi tuntas.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastFri, 3),
  },
  {
    id: "ses-mtk-y",
    ...aisyah,
    subject: "Matematika",
    ...slot(subWeeks(lastWed, 3), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Pola bilangan",
    notes: "Aisyah perlu latihan soal pola bilangan bertingkat.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastWed, 3),
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

  /* Sesi yang tidak terlaksana tidak perlu divalidasi */
  const held = sessions.filter((s) => !s.cancelReason)

  return {
    pending: held
      .filter((s) => s.status === "belum_divalidasi")
      .sort(byNewest),
    history: held
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

/* ---------- W7 · Riwayat Les ---------- */

export type LessonHistory = {
  students: { id: string; name: string }[]
  studentId: string
  /* Bulan yang punya sesi (awal bulan), terbaru dulu */
  months: Date[]
  month: Date
  sessions: AttendanceSession[]
  summary: {
    held: number
    cancelled: number
    /* Sesi terjadwal dari besok sampai akhir bulan (bulan berjalan saja) */
    upcoming: number
    bySubject: { subject: string; count: number }[]
  }
}

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

/*
 * TODO(backend): httpClient.get("/wali/riwayat-les", { params: { siswa, bulan } })
 */
export async function getLessonHistory(
  studentId?: string,
  month?: Date
): Promise<LessonHistory> {
  assertMockAllowed()
  await delay()

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0]
  const own = sessions.filter((s) => s.studentId === student.id)
  const current = monthStart(new Date())

  const monthKeys = new Set([current.getTime()])
  own.forEach((s) => monthKeys.add(monthStart(s.start).getTime()))
  const months = [...monthKeys].sort((a, b) => b - a).map((t) => new Date(t))

  const active = monthStart(month ?? current)
  const inMonth = own
    .filter((s) => isSameMonth(s.start, active))
    .sort(byNewest)
  const held = inMonth.filter((s) => !s.cancelReason)

  const bySubject = new Map<string, number>()
  held.forEach((s) => bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + 1))

  return {
    students: STUDENTS.map((s) => ({ id: s.id, name: s.name })),
    studentId: student.id,
    months,
    month: active,
    sessions: inMonth,
    summary: {
      held: held.length,
      cancelled: inMonth.length - held.length,
      upcoming: isSameMonth(active, current)
        ? countUpcomingSessions(student.id, endOfMonth(active))
        : 0,
      /* Mapel dengan sesi terbanyak dulu */
      bySubject: [...bySubject]
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject)),
    },
  }
}

export const lessonHistoryQuery = (studentId?: string, month?: Date) =>
  queryOptions({
    queryKey: ["absensi", "riwayat-les", studentId ?? "default", month?.getTime() ?? "now"],
    queryFn: () => getLessonHistory(studentId, month),
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
