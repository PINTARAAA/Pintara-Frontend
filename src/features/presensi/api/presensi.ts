import { queryOptions } from "@tanstack/react-query"
import { format } from "date-fns"

import { sessions } from "@/lib/data/presensi"
import { getErrorMessage, httpClient, isApiError } from "@/lib/api"
import type {
  AttendanceErrorCode,
  AttendanceInput,
  AttendanceStatusOverview,
  TutorHistory,
  TutorSession,
  TutorSessionList,
} from "@/types/presensi"

/*
 * Presensi & Dokumentasi (tutor) · Figma PINTARA → UI Screen → Tutor → T2
 *
 * Semua endpoint tutor (/tutor/presensi, /tutor/dokumentasi, /tutor/riwayat)
 * sudah memakai BE. Data mock `@/lib/data/presensi` masih dibaca helper
 * bagian P6/T7 di bawah (verifikasi presensi pengelola & notifikasi) sampai
 * branch integrasinya.
 */

/* ---------- Daftar ---------- */

/* Perlu diisi · nanti hari ini · sudah diisi (urutan dari BE) */
export async function getTutorSessions(): Promise<TutorSessionList> {
  const { data } = await httpClient.get<TutorSessionList>("/tutor/presensi")
  return data
}

export const tutorSessionsQuery = () =>
  queryOptions({ queryKey: ["presensi", "daftar"], queryFn: getTutorSessions })

/* ---------- T3 · Status presensi per bulan ---------- */

/* "2026-11" untuk query `bulan` */
const monthParam = (month?: Date) =>
  month ? { bulan: format(month, "yyyy-MM") } : undefined

/* Sesi yang sudah dimulai pada bulan tsb, dikelompokkan per status validasi */
export async function getAttendanceStatus(
  month?: Date
): Promise<AttendanceStatusOverview> {
  const { data } = await httpClient.get<AttendanceStatusOverview>(
    "/tutor/presensi/status",
    { params: monthParam(month) }
  )
  return data
}

export const attendanceStatusQuery = (month?: Date) =>
  queryOptions({
    queryKey: ["presensi", "status", month?.getTime() ?? "now"],
    queryFn: () => getAttendanceStatus(month),
  })

/* ---------- T4 · Riwayat les tutor ---------- */

/* Riwayat bulan tsb; `siswa` = nama siswa (sama dengan daftar `students`) */
export async function getTutorHistory(
  month?: Date,
  student?: string | null
): Promise<TutorHistory> {
  const { data } = await httpClient.get<TutorHistory>("/tutor/riwayat", {
    params: { ...monthParam(month), ...(student && { siswa: student }) },
  })
  return data
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

/* ---------- T7 · Sumber notifikasi tutor ---------- */

/* Salinan semua sesi tutor (notifikasi presensi terlewat & keberatan) */
export function snapshotTutorSessions() {
  return structuredClone(sessions)
}

/* ---------- Detail ---------- */

/*
 * already_filled (409; juga "keberatan sudah ditinjau" di endpoint pengelola)
 * / not_started (400) dari BE
 */
export function attendanceErrorCode(error: unknown): AttendanceErrorCode | null {
  if (!isApiError(error)) return null
  return error.serverCode === "already_filled" ||
    error.serverCode === "not_started"
    ? error.serverCode
    : null
}

/* 404 dari BE (sesi tidak ada / bukan milik tutor) */
export const isNotFoundError = (error: unknown) =>
  isApiError(error) && error.code === "not_found"

export async function getTutorSession(id: string): Promise<TutorSession> {
  const { data } = await httpClient.get<TutorSession>(
    `/tutor/presensi/${encodeURIComponent(id)}`
  )
  return data
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

export type UploadedDocumentation = { name: string; size: number; url: string }

/* Unggahan besar (maks. 5 MB) butuh waktu lebih lama dari batas umum 15 detik */
const UPLOAD_TIMEOUT_MS = 120_000

/*
 * Unggah dokumentasi (multipart, field `file`) dengan progres.
 * Kembalikan fungsi pembatal; unggahan yang dibatalkan tidak memanggil onError.
 */
export function uploadDocumentation(
  file: File,
  handlers: {
    onProgress: (percent: number) => void
    onDone: (uploaded: UploadedDocumentation) => void
    onError: (message: string) => void
  }
) {
  const controller = new AbortController()
  const form = new FormData()
  form.append("file", file)

  httpClient
    .post<UploadedDocumentation>("/tutor/dokumentasi", form, {
      signal: controller.signal,
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: (event) => {
        if (event.total) {
          handlers.onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    })
    .then(({ data }) => handlers.onDone(data))
    .catch((error: unknown) => {
      if (isApiError(error) && error.code === "canceled") return
      handlers.onError(getErrorMessage(error))
    })

  return () => controller.abort()
}

/* ---------- Simpan presensi ---------- */

/* 409 already_filled bila sudah diisi; 400 not_started bila sesi belum mulai */
export async function submitAttendance(
  id: string,
  input: AttendanceInput
): Promise<TutorSession> {
  const body = input.held
    ? {
        held: true,
        actualStart: input.actualStart,
        actualEnd: input.actualEnd,
        studentPresent: input.studentPresent,
        topic: input.topic.trim(),
        notes: input.notes.trim(),
        ...(input.attachment && { attachment: input.attachment }),
      }
    : { held: false, cancelReason: input.cancelReason.trim() }
  const { data } = await httpClient.post<TutorSession>(
    `/tutor/presensi/${encodeURIComponent(id)}`,
    body
  )
  return data
}
