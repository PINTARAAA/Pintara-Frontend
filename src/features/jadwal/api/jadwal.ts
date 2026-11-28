import { queryOptions } from "@tanstack/react-query"

import type { ScheduleChangeInput } from "@/features/jadwal/schemas"
import { STUDENTS } from "@/lib/data/dashboard"
import { changeRequests, OPEN_STATUSES } from "@/lib/data/jadwal"
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
 * masih dibaca helper di bawah untuk notifikasi pengelola sampai branch
 * integrasinya.
 */

export const isOpenRequest = (r: ChangeRequest) =>
  OPEN_STATUSES.includes(r.status)

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

/* 404 dari BE: jadwal/pengajuan tidak ada atau bukan milik pengguna ini */
export const isNotFoundError = (error: unknown) =>
  isApiError(error) && error.code === "not_found"

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

