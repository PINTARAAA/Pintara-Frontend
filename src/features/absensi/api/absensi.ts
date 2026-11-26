import { queryOptions } from "@tanstack/react-query"
import { endOfMonth, isSameMonth } from "date-fns"

import { countUpcomingSessions } from "@/features/jadwal/api"
import { sessions } from "@/lib/data/absensi"
import { STUDENTS } from "@/lib/data/dashboard"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  AttendanceOverview,
  AttendanceSession,
  LessonHistory,
} from "@/types/absensi"

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

/* ---------- Daftar ---------- */

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
