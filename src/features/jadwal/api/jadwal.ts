import { queryOptions } from "@tanstack/react-query"
import {
  addDays,
  getDay,
  isAfter,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import { STUDENTS, type WaliStudent } from "@/features/dashboard/api/wali-dashboard"
import type { ScheduleChangeInput } from "@/features/jadwal/schemas/perubahan-jadwal-schema"

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

/* Nama hari sesuai getDay() date-fns: 0 = Minggu */
export const WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const

export type Tutor = { name: string; shortName: string }

/* Jadwal rutin mingguan satu mata pelajaran */
export type Routine = {
  id: string
  studentId: string
  subject: string
  weekday: number
  /* "HH.mm" */
  startTime: string
  durationMinutes: number
  tutor: Tutor
  location: string
  since: Date
}

export type ChangeRequestStatus =
  | "ditinjau_pengelola"
  | "konfirmasi_tutor"
  | "disetujui"
  | "ditolak"

export type ChangeRequest = {
  id: string
  routineId: string
  studentId: string
  subject: string
  tutor: Tutor
  durationMinutes: number
  from: { weekday: number; startTime: string }
  to: { weekday: number; startTime: string }
  /* sekali = hanya sesi terdekat; seterusnya = mulai `effectiveDate` */
  scope: "sekali" | "seterusnya"
  effectiveDate: Date
  reason: string
  status: ChangeRequestStatus
  submittedAt: Date
}

export type Session = {
  id: string
  routineId: string
  subject: string
  start: Date
  end: Date
  tutorName: string
}

/* ---------- Utilitas waktu "HH.mm" ---------- */

export function parseTime(time: string) {
  const [h, m] = time.split(/[.:]/).map(Number)
  return { hours: h, minutes: m }
}

/* "16.00" + 90 → "17.30" */
export function addMinutesToTime(time: string, minutes: number) {
  const { hours, minutes: m } = parseTime(time)
  const total = hours * 60 + m + minutes
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(Math.floor(total / 60) % 24)}.${pad(total % 60)}`
}

/* "16.00–17.30" */
export const formatTimeSlot = (startTime: string, durationMinutes: number) =>
  `${startTime}–${addMinutesToTime(startTime, durationMinutes)}`

function withTime(day: Date, time: string) {
  const { hours, minutes } = parseTime(time)
  return setMinutes(setHours(startOfDay(day), hours), minutes)
}

/* Sesi berikutnya dari jadwal rutin (hari ini dihitung bila belum dimulai) */
export function nextSessionStart(
  weekday: number,
  startTime: string,
  now = new Date()
) {
  const offset = (weekday - getDay(now) + 7) % 7
  const candidate = withTime(addDays(now, offset), startTime)
  return isAfter(candidate, now) ? candidate : addDays(candidate, 7)
}

/* ---------- Data contoh ---------- */

const BUDI: Tutor = { name: "Kak Budi Santoso", shortName: "Kak Budi" }
const NADIA: Tutor = { name: "Kak Nadia Safitri", shortName: "Kak Nadia" }

const routines: Routine[] = [
  {
    id: "rut-mtk-s1",
    studentId: "s1",
    subject: "Matematika",
    weekday: 3,
    startTime: "16.00",
    durationMinutes: 90,
    tutor: BUDI,
    location: "Jl. Trunojoyo No. 12, Bangkalan",
    since: at(-19, 0),
  },
  {
    id: "rut-ipa-s1",
    studentId: "s1",
    subject: "IPA",
    weekday: 5,
    startTime: "16.00",
    durationMinutes: 90,
    tutor: BUDI,
    location: "Jl. Trunojoyo No. 12, Bangkalan",
    since: at(-17, 0),
  },
  {
    id: "rut-bing-s2",
    studentId: "s2",
    subject: "Bahasa Inggris",
    weekday: 4,
    startTime: "15.00",
    durationMinutes: 90,
    tutor: NADIA,
    location: "Jl. Trunojoyo No. 12, Bangkalan",
    since: at(-30, 0),
  },
]

const changeRequests: ChangeRequest[] = []

const OPEN_STATUSES: ChangeRequestStatus[] = [
  "ditinjau_pengelola",
  "konfirmasi_tutor",
]
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

export type WaliSchedule = {
  students: WaliStudent[]
  activeStudentId: string
  pendingRequests: ChangeRequest[]
  week: { from: Date; to: Date; sessions: Session[] }
  routines: Routine[]
  unreadNotifications: number
}

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

export type RoutineDetail = Routine & {
  studentName: string
  nextSession: Date
  /* Pengajuan perubahan yang masih diproses untuk jadwal ini */
  pendingRequest: ChangeRequest | null
}

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
  return request
}
