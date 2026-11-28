import { queryOptions } from "@tanstack/react-query"
import { format } from "date-fns"

import { httpClient, isApiError } from "@/lib/api"
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
 *   getLessonHistory(…)      → GET /wali/riwayat-les
 */

/* ---------- Daftar ---------- */

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

/*
 * Riwayat les satu anak pada satu bulan (`siswa` = id siswa, `bulan` =
 * "YYYY-MM"). Tanpa parameter: anak pertama dan bulan berjalan.
 * `sessions` memuat semua sesi bulan tsb termasuk yang belum berlangsung.
 */
export async function getLessonHistory(
  studentId?: string,
  month?: Date
): Promise<LessonHistory> {
  const { data } = await httpClient.get<LessonHistory>("/wali/riwayat-les", {
    params: {
      ...(studentId && { siswa: studentId }),
      ...(month && { bulan: format(month, "yyyy-MM") }),
    },
  })
  return data
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
