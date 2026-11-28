import { queryOptions } from "@tanstack/react-query"
import { addDays } from "date-fns"

import type { ScheduleChangeInput } from "@/features/jadwal/schemas"
import { addNotification } from "@/features/notifikasi/api"
import { STUDENTS } from "@/lib/data/dashboard"
import {
  changeRequests,
  nextSessionStart,
  OPEN_STATUSES,
  routines,
  WEEKDAYS,
} from "@/lib/data/jadwal"
import { httpClient, isApiError } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  ChangeRequest,
  ChangeRequestForReview,
  RoutineDetail,
  WaliSchedule,
} from "@/types/jadwal"

/*
 * Jadwal Les & Perubahan Jadwal · Figma PINTARA → UI Screen → Wali Murid → W4
 *
 * Sudah memakai BE: getWaliSchedule, getRoutine.
 *
 * TODO(backend):
 *   getChangeRequest(id)     → httpClient.get(`/wali/pengajuan-jadwal/${id}`)
 *   submitScheduleChange()   → httpClient.post("/wali/pengajuan-jadwal", input)
 *
 * Selama backend belum ada (mode development) data disimpan di memori:
 * pengajuan yang dikirim langsung tampil di daftar "Pengajuan perubahan".
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
  assertMockAllowed()
  await delay(300)

  const request = changeRequests.find((r) => r.id === id)
  if (!request) throw new NotFoundError("Pengajuan")
  return request
}

export const changeRequestQuery = (id: string) =>
  queryOptions({
    queryKey: ["jadwal", "pengajuan", id],
    queryFn: () => getChangeRequest(id),
  })

export async function submitScheduleChange(
  routineId: string,
  input: ScheduleChangeInput
): Promise<ChangeRequest> {
  assertMockAllowed()
  await delay(800)

  if (!navigator.onLine) {
    throw new Error("Tidak ada koneksi internet.")
  }
  const routine = routines.find((r) => r.id === routineId)
  if (!routine) throw new NotFoundError("Jadwal")

  const next = nextSessionStart(routine.weekday, routine.startTime)
  const request: ChangeRequest = {
    id: `pj-${Date.now()}`,
    routineId,
    studentId: routine.studentId,
    subject: routine.subject,
    tutor: routine.tutor,
    durationMinutes: routine.durationMinutes,
    from: { weekday: routine.weekday, startTime: routine.startTime },
    to: {
      weekday: WEEKDAYS.indexOf(input.day as (typeof WEEKDAYS)[number]),
      startTime: input.startTime,
    },
    scope: input.scope as ChangeRequest["scope"],
    effectiveDate: input.scope === "sekali" ? next : addDays(next, 7),
    reason: input.reason.trim(),
    status: "ditinjau_pengelola",
    submittedAt: new Date(),
  }
  changeRequests.push(request)
  const from = WEEKDAYS[request.from.weekday]
  const to = WEEKDAYS[request.to.weekday]
  addNotification({
    kind: "jadwal",
    title: "Pengajuan perubahan jadwal terkirim",
    body: `${from === to ? from : `${from} → ${to}`}, ${request.to.startTime} · menunggu Pengelola`,
    to: `/wali/jadwal/pengajuan/${request.id}`,
  })
  return request
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

