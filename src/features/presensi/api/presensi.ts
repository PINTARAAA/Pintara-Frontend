import { queryOptions } from "@tanstack/react-query"
import { isAfter, isSameMonth, isToday } from "date-fns"

import { sessions } from "@/lib/data/presensi"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  AttendanceErrorCode,
  AttendanceInput,
  AttendanceStatusOverview,
  ObjectionResolution,
  TutorHistory,
  TutorSession,
  TutorSessionList,
  ValidationStatus,
} from "@/types/presensi"

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

/* ---------- Daftar ---------- */

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

/* ---------- P6 · Verifikasi final presensi (pengelola) ---------- */

/* Presensi lengkap = sudah divalidasi wali (atau ditinjau Pengelola), belum final */
export const isReadyForFinal = (s: TutorSession) =>
  !!s.record && s.record.validation === "sudah_divalidasi" && !s.record.finalAt

/* Tandai final semua presensi lengkap pada bulan tsb; kembalikan jumlahnya */
export function finalizeReadySessions(month: Date) {
  const now = new Date()
  const ready = sessions.filter(
    (s) => isReadyForFinal(s) && isSameMonth(s.start, month)
  )
  ready.forEach((s) => {
    if (s.record) s.record.finalAt = now
  })
  return ready.length
}

/* Tinjauan keberatan: presensi kembali lengkap (siap diverifikasi final) */
export function resolveObjection(id: string, input: ObjectionResolution) {
  const session = find(id)
  const record = session.record
  if (!record || record.validation !== "keberatan") {
    throw new AttendanceError("already_filled")
  }
  if (input.corrected) {
    record.actualStart = input.actualStart
    record.actualEnd = input.actualEnd
  }
  record.validation = "sudah_divalidasi"
  record.validatedAt = new Date()
  record.review = {
    corrected: input.corrected,
    note: input.note.trim(),
    at: new Date(),
  }
  return structuredClone(session)
}

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
