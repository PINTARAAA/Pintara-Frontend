import { queryOptions } from "@tanstack/react-query"
import { addDays, startOfDay } from "date-fns"

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
 * TODO(backend):
 *   getWaliSchedule(siswa)   → httpClient.get("/wali/jadwal", { params: { siswa } })
 *   getRoutine(id)           → httpClient.get(`/wali/jadwal/${id}`)
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

export async function getWaliSchedule(studentId?: string): Promise<WaliSchedule> {
  assertMockAllowed()
  await delay()

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0]
  const own = routines.filter((r) => r.studentId === student.id)

  /* "Minggu ini" = 7 hari mulai hari ini */
  const now = new Date()
  const from = startOfDay(now)
  const to = addDays(from, 6)
  const sessions = own
    .map((r) => {
      const start = nextSessionStart(r.weekday, r.startTime, now)
      return {
        id: `${r.id}-${start.getTime()}`,
        routineId: r.id,
        subject: r.subject,
        start,
        end: new Date(start.getTime() + r.durationMinutes * 60_000),
        tutorName: r.tutor.name,
      }
    })
    .filter((s) => s.start < addDays(to, 1))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  return {
    students: STUDENTS,
    activeStudentId: student.id,
    pendingRequests: changeRequests.filter(
      (r) => r.studentId === student.id && isOpenRequest(r)
    ),
    week: { from, to, sessions },
    routines: own.sort((a, b) => a.weekday - b.weekday),
    unreadNotifications: student.id === "s1" ? 2 : 0,
  }
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

export async function getRoutine(id: string): Promise<RoutineDetail> {
  assertMockAllowed()
  await delay(300)

  const routine = routines.find((r) => r.id === id)
  if (!routine) throw new NotFoundError("Jadwal")
  return {
    ...routine,
    studentName:
      STUDENTS.find((s) => s.id === routine.studentId)?.name ?? "Siswa",
    nextSession: nextSessionStart(routine.weekday, routine.startTime),
    pendingRequest:
      changeRequests.find((r) => r.routineId === id && isOpenRequest(r)) ??
      null,
  }
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

export function findRequestForReview(id: string) {
  const request = changeRequests.find((r) => r.id === id)
  if (!request) throw new NotFoundError("Pengajuan")
  return withNames(request)
}

/*
 * Keputusan Pengelola. Disetujui + "seterusnya": jadwal rutin ikut pindah.
 * Wali menerima notifikasi (W9) dan statusnya tampil di W4.
 */
export function decideChangeRequest(id: string, approved: boolean) {
  const request = changeRequests.find((r) => r.id === id)
  if (!request) throw new NotFoundError("Pengajuan")
  if (request.status !== "ditinjau_pengelola") {
    throw new Error("Pengajuan sudah diputuskan.")
  }
  request.status = approved ? "disetujui" : "ditolak"

  const routine = routines.find((r) => r.id === request.routineId)
  if (approved && request.scope === "seterusnya" && routine) {
    routine.weekday = request.to.weekday
    routine.startTime = request.to.startTime
  }
  const to = `${WEEKDAYS[request.to.weekday]}, ${request.to.startTime}`
  addNotification({
    kind: "jadwal",
    title: approved
      ? "Perubahan jadwal disetujui"
      : "Pengajuan perubahan jadwal ditolak",
    body: approved
      ? `${request.subject} pindah ke ${to}`
      : `${request.subject} tetap ${WEEKDAYS[request.from.weekday]}, ${request.from.startTime}`,
    to: `/wali/jadwal/pengajuan/${request.id}`,
  })
  return withNames(request)
}
