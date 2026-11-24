import { queryOptions } from "@tanstack/react-query"
import {
  isAfter,
  isToday,
  previousFriday,
  previousWednesday,
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
}

export type TutorSession = {
  id: string
  subject: string
  student: { name: string; parentName: string }
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
const AISYAH = { name: "Aisyah Putri", parentName: "Sari Wulandari" }

const sessions: TutorSession[] = [
  {
    id: "ts-dimas-1",
    subject: "IPA",
    student: { name: "Dimas Pratama", parentName: "Arif Pratama" },
    ...slot(at(-1, 0), 16),
    record: null,
  },
  {
    id: "ts-rizky-1",
    subject: "IPA",
    student: { name: "Rizky Ananda", parentName: "Dewi Ananda" },
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
      submittedAt: slot(previousFriday(today), 17, 45).start,
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
    },
  },
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
