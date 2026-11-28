import { queryOptions } from "@tanstack/react-query"
import { endOfMonth, isSameMonth } from "date-fns"

import { countUpcomingSessions } from "@/features/jadwal/api"
import { httpClient, isApiError } from "@/lib/api"
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
 * Sudah memakai BE:
 *   getAttendance()          → GET /wali/presensi
 *   getSession(id)           → GET /wali/presensi/:id
 *   approveSession(id)       → POST /wali/presensi/:id/setujui
 *   submitObjection(id, …)   → POST /wali/presensi/:id/keberatan
 *   submitReview(id, …)      → POST /wali/presensi/:id/ulasan
 *
 * Riwayat les (W7) masih memakai data mock, lihat getLessonHistory().
 */

/* ---------- Daftar ---------- */

const byNewest = (a: AttendanceSession, b: AttendanceSession) =>
  b.start.getTime() - a.start.getTime()

/*
 * Sesi yang sudah dimulai dan diisi tutor (sesi batal tidak ikut).
 * pending = belum divalidasi, history = sudah divalidasi / keberatan;
 * keduanya urut terbaru dulu dari BE.
 */
export async function getAttendance(): Promise<AttendanceOverview> {
  const { data } = await httpClient.get<AttendanceOverview>("/wali/presensi")
  return data
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

/*
 * 404 (sesi tidak ada) atau 403 (sesi milik wali lain) dari BE.
 * Keduanya ditampilkan "Sesi tidak ditemukan" agar data tidak bocor.
 */
export const isNotFoundError = (error: unknown) =>
  isApiError(error) &&
  (error.code === "not_found" || error.code === "forbidden")

export async function getSession(id: string): Promise<AttendanceSession> {
  const { data } = await httpClient.get<AttendanceSession>(
    `/wali/presensi/${encodeURIComponent(id)}`
  )
  return data
}

export const sessionQuery = (id: string) =>
  queryOptions({
    queryKey: ["absensi", "sesi", id],
    queryFn: () => getSession(id),
  })

/* 400 bila presensi belum diisi tutor */
export async function approveSession(id: string): Promise<AttendanceSession> {
  const { data } = await httpClient.post<AttendanceSession>(
    `/wali/presensi/${encodeURIComponent(id)}/setujui`
  )
  return data
}

/* Status jadi keberatan; tutor & pengelola mendapat notifikasi dari BE */
export async function submitObjection(
  id: string,
  reason: string
): Promise<AttendanceSession> {
  const { data } = await httpClient.post<AttendanceSession>(
    `/wali/presensi/${encodeURIComponent(id)}/keberatan`,
    { reason: reason.trim() }
  )
  return data
}

/* rating 1–5; komentar kosong tidak dikirim */
export async function submitReview(
  id: string,
  review: { rating: number; comment: string }
): Promise<AttendanceSession> {
  const comment = review.comment.trim()
  const { data } = await httpClient.post<AttendanceSession>(
    `/wali/presensi/${encodeURIComponent(id)}/ulasan`,
    { rating: review.rating, ...(comment && { comment }) }
  )
  return data
}
