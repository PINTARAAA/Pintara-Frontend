import { queryOptions } from "@tanstack/react-query"
import { addDays } from "date-fns"

import type { ScheduleChangeInput } from "@/features/jadwal/schemas"
import { STUDENTS } from "@/lib/data/dashboard"
import {
  changeRequests,
  nextSessionStart,
  OPEN_STATUSES,
  routines,
} from "@/lib/data/jadwal"
import { httpClient, isApiError } from "@/lib/api"
import type {
  ChangeRequest,
  ChangeRequestForReview,
  RoutineDetail,
  WaliSchedule,
} from "@/types/jadwal"

/*
 * Jadwal Les & Perubahan Jadwal · Figma PINTARA → UI Screen → Wali Murid → W4
 *
 * Semua endpoint jadwal wali sudah memakai BE. Data mock `@/lib/data/jadwal`
 * masih dibaca helper di bawah untuk modul riwayat les (absensi) dan
 * notifikasi pengelola sampai branch integrasinya.
 */

export const isOpenRequest = (r: ChangeRequest) =>
  OPEN_STATUSES.includes(r.status)

/* Jumlah sesi terjadwal anak dari sekarang sampai `until` (W7 · Riwayat Les) */
export function countUpcomingSessions(studentId: string, until: Date) {
  const now = new Date()
  let count = 0
  for (const r of routines.filter((r) => r.studentId === studentId)) {
    for (
      let start = nextSessionStart(r.weekday, r.startTime, now);
      start <= until;
      start = addDays(start, 7)
    ) {
      count++
    }
  }
  return count
}

/* ---------- Daftar jadwal ---------- */

/* Jadwal minggu ini, jadwal rutin, dan pengajuan terbuka untuk satu anak */
export async function getWaliSchedule(studentId?: string): Promise<WaliSchedule> {
  const { data } = await httpClient.get<WaliSchedule>("/wali/jadwal", {
    params: studentId ? { siswa: studentId } : undefined,
  })
  return data
}

export const waliScheduleQuery = (studentId?: string) =>
  queryOptions({
    queryKey: ["jadwal", "wali", studentId ?? "default"],
    queryFn: () => getWaliSchedule(studentId),
  })

/* ---------- Detail jadwal rutin ---------- */

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} tidak ditemukan.`)
    this.name = "NotFoundError"
  }
}

/* 404 dari BE (atau dari mock yang belum diintegrasikan) */
export const isNotFoundError = (error: unknown) =>
  (isApiError(error) && error.code === "not_found") ||
  error instanceof NotFoundError

/* Jadwal rutin + sesi berikutnya + pengajuan terbuka; 404 bila bukan milik wali */
export async function getRoutine(id: string): Promise<RoutineDetail> {
  const { data } = await httpClient.get<RoutineDetail>(
    `/wali/jadwal/${encodeURIComponent(id)}`
  )
  return data
}

export const routineQuery = (id: string) =>
  queryOptions({
    queryKey: ["jadwal", "rutin", id],
    queryFn: () => getRoutine(id),
  })

/* ---------- Pengajuan perubahan ---------- */

export async function getChangeRequest(id: string): Promise<ChangeRequest> {
  const { data } = await httpClient.get<ChangeRequest>(
    `/wali/pengajuan-jadwal/${encodeURIComponent(id)}`
  )
  return data
}

export const changeRequestQuery = (id: string) =>
  queryOptions({
    queryKey: ["jadwal", "pengajuan", id],
    queryFn: () => getChangeRequest(id),
  })

/* Pengajuan masuk ke Pengelola (status ditinjau_pengelola) */
export async function submitScheduleChange(
  routineId: string,
  input: ScheduleChangeInput
): Promise<ChangeRequest> {
  const { data } = await httpClient.post<ChangeRequest>(
    "/wali/pengajuan-jadwal",
    {
      routineId,
      scope: input.scope,
      day: input.day,
      startTime: input.startTime,
      reason: input.reason.trim(),
    }
  )
  return data
}

/* ---------- P5 · Tinjau pengajuan (pengelola) ---------- */

const withNames = (r: ChangeRequest): ChangeRequestForReview => ({
  ...structuredClone(r),
  studentName: STUDENTS.find((s) => s.id === r.studentId)?.name ?? "Siswa",
  /* TODO(backend): nama wali dari data akun */
  parentName: "Sari Wulandari",
})

/* Pengajuan yang menunggu keputusan Pengelola */
export function listRequestsForReview() {
  return changeRequests
    .filter((r) => r.status === "ditinjau_pengelola")
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .map(withNames)
}

