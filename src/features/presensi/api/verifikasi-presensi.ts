import { queryOptions } from "@tanstack/react-query"
import { format, startOfMonth } from "date-fns"

import { httpClient } from "@/lib/api"
import type {
  FinalOverview,
  ObjectionResolution,
  TutorSession,
} from "@/types/presensi"

/*
 * Verifikasi Final Presensi (pengelola) · Figma PINTARA → UI Screen →
 * Pengelola LBB → P6 · Verifikasi Final Presensi
 *
 * Sudah memakai BE:
 *   getFinalOverview(bulan)       → GET /pengelola/presensi
 *   finalizeAttendance(bulan)     → POST /pengelola/presensi/final
 *   getObjection(sessionId)       → GET /pengelola/presensi/:id/keberatan
 *   reviewObjection(sessionId, …) → POST /pengelola/presensi/:id/keberatan
 */

/* "Kak Budi" dari "Kak Budi Santoso"; null bila BE tidak mengirim tutor */
export const tutorShortName = (s: TutorSession) =>
  s.tutor ? s.tutor.name.split(" ").slice(0, 2).join(" ") : null

/* "bulan" = "2026-11" */
const monthBody = (month?: Date) =>
  month ? { bulan: format(month, "yyyy-MM") } : {}

/* ---------- Ringkasan per bulan ---------- */

/*
 * Presensi sesi yang sudah dimulai pada bulan tsb (default bulan berjalan):
 * final, siap difinalkan, menunggu wali, keberatan, belum dikumpulkan.
 */
export async function getFinalOverview(month?: Date): Promise<FinalOverview> {
  const { data } = await httpClient.get<FinalOverview>("/pengelola/presensi", {
    params: monthBody(month),
  })
  return data
}

export const finalOverviewQuery = (month?: Date) =>
  queryOptions({
    queryKey: [
      "presensi",
      "final",
      month ? startOfMonth(month).getTime() : "now",
    ],
    queryFn: () => getFinalOverview(month),
  })

/* Verifikasi final semua presensi lengkap di bulan tsb; kembalikan jumlahnya */
export async function finalizeAttendance(month: Date): Promise<number> {
  const { data } = await httpClient.post<number>(
    "/pengelola/presensi/final",
    monthBody(month)
  )
  return data
}

/* ---------- Tinjau keberatan ---------- */

/* 404 bila sesi tidak ada; record.validation menentukan masih perlu ditinjau */
export async function getObjection(sessionId: string): Promise<TutorSession> {
  const { data } = await httpClient.get<TutorSession>(
    `/pengelola/presensi/${encodeURIComponent(sessionId)}/keberatan`
  )
  return data
}

export const objectionQuery = (sessionId: string) =>
  queryOptions({
    queryKey: ["presensi", "keberatan", sessionId],
    queryFn: () => getObjection(sessionId),
  })

/*
 * Presensi kembali sudah_divalidasi (siap difinalkan); wali mendapat
 * notifikasi dari BE. 409 already_filled bila keberatan sudah ditinjau.
 */
export async function reviewObjection(
  sessionId: string,
  input: ObjectionResolution
): Promise<TutorSession> {
  const body = input.corrected
    ? {
        corrected: true,
        actualStart: input.actualStart,
        actualEnd: input.actualEnd,
        note: input.note.trim(),
      }
    : { corrected: false, note: input.note.trim() }
  const { data } = await httpClient.post<TutorSession>(
    `/pengelola/presensi/${encodeURIComponent(sessionId)}/keberatan`,
    body
  )
  return data
}
