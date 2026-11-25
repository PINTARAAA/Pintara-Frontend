import { queryOptions } from "@tanstack/react-query"
import {
  isAfter,
  isToday,
  isSameMonth,
  previousFriday,
  previousMonday,
  previousSaturday,
  previousThursday,
  previousTuesday,
  previousWednesday,
  subWeeks,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import type { StatusOf } from "@/lib/constants/status"

/*
 * Presensi & Dokumentasi (tutor) · Figma PINTARA → UI Screen → Tutor → T2
 *
 * TODO(backend):
 *   getTutorSessions()        → httpClient.get("/tutor/presensi")
 *   getTutorSession(id)       → httpClient.get(`/tutor/presensi/${id}`)
 *   uploadDocumentation(file) → httpClient.post("/tutor/dokumentasi", form,
 *                               { onUploadProgress })
 *   submitAttendance(id, …)   → httpClient.post(`/tutor/presensi/${id}`, …)
 *   Petakan respons "presensi sudah ada" ke AttendanceError("already_filled").
 *
 * Selama backend belum ada (mode development) data disimpan di memori.
 */
export type ValidationStatus = Extract<
  StatusOf<"presensi">,
  "belum_divalidasi" | "sudah_divalidasi" | "keberatan"
>

export type AttendanceRecord = {
  held: boolean
  /* "HH.mm" — hanya bila terlaksana */
  actualStart?: string
  actualEnd?: string
  studentPresent?: boolean
  topic?: string
  notes?: string
  attachment?: { name: string; size: number }
  cancelReason?: string
  submittedAt: Date
  validation: ValidationStatus
  /* Diisi bila wali mengajukan keberatan (W5) */
  objection?: { reason: string; at: Date }
  /* Waktu wali menyetujui kehadiran */
  validatedAt?: Date
}

export type TutorSession = {
  id: string
  subject: string
  student: {
    name: string
    parentName: string
    /* Sapaan wali, mis. "Ibu" / "Bapak" */
    parentSalutation: string
  }
  start: Date
  end: Date
  record: AttendanceRecord | null
}

/* ---------- Data contoh ---------- */

function slot(day: Date, hour: number, minute = 0, minutes = 90) {
  const start = setMinutes(setHours(startOfDay(day), hour), minute)
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const today = new Date()
const AISYAH = { name: "Aisyah Putri", parentName: "Sari Wulandari", parentSalutation: "Ibu" }
const DIMAS = { name: "Dimas Pratama", parentName: "Arif Pratama", parentSalutation: "Bapak" }
const RIZKY = { name: "Rizky Ananda", parentName: "Dewi Ananda", parentSalutation: "Ibu" }

/* Presensi yang sudah divalidasi wali (sesi lampau) */
function verified(
  id: string,
  subject: string,
  student: typeof AISYAH,
  day: Date,
  topic: string
): TutorSession {
  const time = slot(day, 16)
  return {
    id,
    subject,
    student,
    ...time,
    record: {
      held: true,
      actualStart: "16.00",
      actualEnd: "17.30",
      studentPresent: true,
      topic,
      submittedAt: new Date(time.end.getTime() + 10 * 60_000),
      validation: "sudah_divalidasi",
      validatedAt: new Date(time.end.getTime() + 3 * 3_600_000),
    },
  }
}

const sessions: TutorSession[] = [
  {
    id: "ts-dimas-1",
    subject: "IPA",
    student: DIMAS,
    ...slot(at(-1, 0), 16),
    record: null,
  },
  {
    id: "ts-rizky-1",
    subject: "IPA",
    student: RIZKY,
    /* Sama dengan "Les berikutnya" di Beranda tutor */
    ...slot(today.getHours() < 17 ? today : at(1, 0), today.getHours() < 17 ? 18 : 16, today.getHours() < 17 ? 30 : 0),
    record: null,
  },
  {
    id: "ts-aisyah-ipa",
    subject: "IPA",
    student: AISYAH,
    ...slot(previousFriday(today), 16),
    record: {
      held: true,
      actualStart: "16.00",
      actualEnd: "17.30",
      studentPresent: true,
      topic: "Sistem pencernaan manusia",
      attachment: { name: "foto_sesi_ipa.jpg", size: 1_200_000 },
      submittedAt: slot(previousFriday(today), 17, 45).start,
      validation: "belum_divalidasi",
    },
  },
  {
    id: "ts-rizky-mtk",
    subject: "Matematika",
    student: RIZKY,
    ...slot(previousSaturday(today), 9),
    record: {
      held: true,
      actualStart: "09.00",
      actualEnd: "10.30",
      studentPresent: true,
      topic: "Fungsi kuadrat",
      notes: "Lanjut latihan grafik fungsi",
      submittedAt: slot(previousSaturday(today), 10, 5).start,
      validation: "belum_divalidasi",
    },
  },
  {
    id: "ts-aisyah-mtk",
    subject: "Matematika",
    student: AISYAH,
    ...slot(previousWednesday(today), 16),
    record: {
      held: true,
      actualStart: "16.00",
      actualEnd: "17.30",
      studentPresent: true,
      topic: "Persamaan linear satu variabel",
      submittedAt: slot(previousWednesday(today), 17, 40).start,
      validation: "keberatan",
      objection: {
        reason: "Les hanya berlangsung 45 menit, bukan 90 menit seperti yang tercatat.",
        at: slot(previousWednesday(today), 20, 15).start,
      },
    },
  },
  verified("ts-v1", "IPA", RIZKY, previousMonday(today), "Hukum Newton"),
  verified("ts-v2", "Matematika", DIMAS, previousThursday(today), "Statistika dasar"),
  verified("ts-v3", "IPA", AISYAH, subWeeks(previousFriday(today), 1), "Sistem peredaran darah"),
  verified("ts-v4", "Matematika", AISYAH, subWeeks(previousWednesday(today), 1), "Bentuk aljabar"),
  verified("ts-v5", "IPA", DIMAS, subWeeks(previousMonday(today), 1), "Tekanan zat"),
  verified("ts-v6", "IPA", RIZKY, subWeeks(previousTuesday(today), 1), "Gerak lurus"),
  verified("ts-v7", "Matematika", DIMAS, subWeeks(previousThursday(today), 1), "Peluang"),
  verified("ts-v8", "Matematika", AISYAH, subWeeks(previousWednesday(today), 2), "Bilangan berpangkat"),
  verified("ts-v9", "IPA", DIMAS, subWeeks(previousMonday(today), 2), "Getaran"),
  verified("ts-v10", "IPA", RIZKY, subWeeks(previousTuesday(today), 2), "Besaran dan satuan"),
  verified("ts-v11", "Matematika", DIMAS, subWeeks(previousThursday(today), 2), "Himpunan"),
  verified("ts-v12", "IPA", AISYAH, subWeeks(previousFriday(today), 3), "Klasifikasi makhluk hidup"),
]

/* ---------- Daftar ---------- */

export type TutorSessionList = {
  /* Sesi yang sudah dimulai tetapi belum dipresensi */
  toFill: TutorSession[]
  /* Sesi hari ini yang belum dimulai */
  laterToday: TutorSession[]
  filled: TutorSession[]
}

export async function getTutorSessions(): Promise<TutorSessionList> {
  assertMockAllowed()
  await delay()

  const now = new Date()
  const byStart = (a: TutorSession, b: TutorSession) =>
    a.start.getTime() - b.start.getTime()

  return {
    toFill: sessions
      .filter((s) => !s.record && !isAfter(s.start, now))
      .sort(byStart),
    laterToday: sessions
      .filter((s) => !s.record && isAfter(s.start, now) && isToday(s.start))
      .sort(byStart),
    filled: sessions
      .filter((s) => s.record)
      .sort((a, b) => b.start.getTime() - a.start.getTime()),
  }
}

export const tutorSessionsQuery = () =>
  queryOptions({ queryKey: ["presensi", "daftar"], queryFn: getTutorSessions })

/* ---------- T3 · Status presensi per bulan ---------- */

export type AttendanceStatusOverview = {
  months: Date[]
  month: Date
  /* Sesi yang sudah dimulai pada bulan ini */
  total: number
  disputed: TutorSession[]
  waiting: TutorSession[]
  notCollected: TutorSession[]
  verified: TutorSession[]
}

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

/* TODO(backend): httpClient.get("/tutor/presensi/status", { params: { bulan } }) */
export async function getAttendanceStatus(
  month?: Date
): Promise<AttendanceStatusOverview> {
  assertMockAllowed()
  await delay()

  const now = new Date()
  const current = monthStart(now)
  const active = monthStart(month ?? current)
  const keys = new Set([current.getTime(), active.getTime()])
  sessions.forEach((s) => keys.add(monthStart(s.start).getTime()))
  const months = [...keys].sort((a, b) => b - a).map((t) => new Date(t))
  const started = sessions
    .filter((s) => isSameMonth(s.start, active) && !isAfter(s.start, now))
    .sort((a, b) => b.start.getTime() - a.start.getTime())
  const withStatus = (status: ValidationStatus) =>
    started.filter((s) => s.record?.validation === status)

  return {
    months,
    month: active,
    total: started.length,
    disputed: withStatus("keberatan"),
    waiting: withStatus("belum_divalidasi"),
    notCollected: started.filter((s) => !s.record),
    verified: withStatus("sudah_divalidasi"),
  }
}

export const attendanceStatusQuery = (month?: Date) =>
  queryOptions({
    queryKey: ["presensi", "status", month?.getTime() ?? "now"],
    queryFn: () => getAttendanceStatus(month),
  })

/* ---------- T4 · Riwayat les tutor ---------- */

export type TutorHistory = {
  months: Date[]
  month: Date
  /* Nama siswa yang diajar (untuk filter) */
  students: string[]
  /* null = semua siswa */
  student: string | null
  sessions: TutorSession[]
  summary: {
    held: number
    cancelled: number
    studentCount: number
    byStudent: { name: string; count: number }[]
  }
}

/* TODO(backend): httpClient.get("/tutor/riwayat", { params: { bulan, siswa } }) */
export async function getTutorHistory(
  month?: Date,
  student?: string | null
): Promise<TutorHistory> {
  assertMockAllowed()
  await delay()

  const now = new Date()
  const current = monthStart(now)
  const active = monthStart(month ?? current)
  const keys = new Set([current.getTime(), active.getTime()])
  sessions.forEach((s) => keys.add(monthStart(s.start).getTime()))
  const months = [...keys].sort((a, b) => b - a).map((t) => new Date(t))

  const students = [...new Set(sessions.map((s) => s.student.name))].sort()
  const selected = student && students.includes(student) ? student : null

  const inMonth = sessions
    .filter(
      (s) =>
        isSameMonth(s.start, active) &&
        !isAfter(s.start, now) &&
        (!selected || s.student.name === selected)
    )
    .sort((a, b) => b.start.getTime() - a.start.getTime())

  const held = inMonth.filter((s) => s.record?.held)
  const byStudent = new Map<string, number>()
  held.forEach((s) =>
    byStudent.set(s.student.name, (byStudent.get(s.student.name) ?? 0) + 1)
  )

  return {
    months,
    month: active,
    students,
    student: selected,
    sessions: inMonth,
    summary: {
      held: held.length,
      cancelled: inMonth.filter((s) => s.record && !s.record.held).length,
      studentCount: new Set(inMonth.map((s) => s.student.name)).size,
      byStudent: [...byStudent]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    },
  }
}

export const tutorHistoryQuery = (month?: Date, student?: string | null) =>
  queryOptions({
    queryKey: ["presensi", "riwayat", month?.getTime() ?? "now", student ?? "semua"],
    queryFn: () => getTutorHistory(month, student),
  })

/* ---------- T7 · Sumber notifikasi tutor ---------- */

/* Salinan semua sesi tutor (notifikasi presensi terlewat & keberatan) */
export function snapshotTutorSessions() {
  return structuredClone(sessions)
}

/* ---------- T5 · Pertemuan sebelumnya ---------- */

/* Sesi terlaksana terakhir bersama siswa sebelum `before` (semua mapel) */
export function findLastHeldSession(studentName: string, before: Date) {
  const last = sessions
    .filter(
      (s) => s.student.name === studentName && s.record?.held && s.start < before
    )
    .sort((a, b) => b.start.getTime() - a.start.getTime())[0]
  return last ? structuredClone(last) : null
}

/* ---------- Detail ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Sesi tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

export type AttendanceErrorCode = "already_filled" | "not_started"

export class AttendanceError extends Error {
  code: AttendanceErrorCode
  constructor(code: AttendanceErrorCode) {
    super(code)
    this.name = "AttendanceError"
    this.code = code
  }
}

function find(id: string) {
  const session = sessions.find((s) => s.id === id)
  if (!session) throw new NotFoundError()
  return session
}

export async function getTutorSession(id: string): Promise<TutorSession> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(find(id))
}

export const tutorSessionQuery = (id: string) =>
  queryOptions({
    queryKey: ["presensi", "sesi", id],
    queryFn: () => getTutorSession(id),
  })

/* ---------- Unggah dokumentasi ---------- */

export const DOC_ACCEPT = "image/jpeg,image/png,application/pdf"
export const DOC_MAX_BYTES = 5 * 1024 * 1024

/* Kembalikan pesan error bila file tidak memenuhi syarat */
export function validateDocumentation(file: File): string | null {
  const okType = DOC_ACCEPT.split(",").includes(file.type)
  if (!okType || file.size > DOC_MAX_BYTES) {
    return "Format tidak didukung. Gunakan JPG, PNG, atau PDF maks. 5 MB."
  }
  return null
}

/* Simulasi unggah dengan progres; kembalikan fungsi pembatal */
export function uploadDocumentation(
  file: File,
  handlers: { onProgress: (percent: number) => void; onDone: () => void; onError: () => void }
) {
  let percent = 0
  const timer = window.setInterval(() => {
    if (!navigator.onLine) {
      window.clearInterval(timer)
      handlers.onError()
      return
    }
    percent = Math.min(100, percent + 15 + Math.random() * 20)
    handlers.onProgress(percent)
    if (percent >= 100) {
      window.clearInterval(timer)
      handlers.onDone()
    }
  }, 180)
  void file
  return () => window.clearInterval(timer)
}

/* ---------- Simpan presensi ---------- */

export type AttendanceInput =
  | {
      held: true
      actualStart: string
      actualEnd: string
      studentPresent: boolean
      topic: string
      notes: string
      attachment?: { name: string; size: number }
    }
  | { held: false; cancelReason: string }

export async function submitAttendance(
  id: string,
  input: AttendanceInput
): Promise<TutorSession> {
  assertMockAllowed()
  await delay(800)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")

  const session = find(id)
  if (session.record) throw new AttendanceError("already_filled")
  if (isAfter(session.start, new Date())) throw new AttendanceError("not_started")

  session.record = input.held
    ? {
        held: true,
        actualStart: input.actualStart,
        actualEnd: input.actualEnd,
        studentPresent: input.studentPresent,
        topic: input.topic.trim(),
        notes: input.notes.trim(),
        attachment: input.attachment,
        submittedAt: new Date(),
        validation: "belum_divalidasi",
      }
    : {
        held: false,
        cancelReason: input.cancelReason.trim(),
        submittedAt: new Date(),
        validation: "belum_divalidasi",
      }
  return structuredClone(session)
}
