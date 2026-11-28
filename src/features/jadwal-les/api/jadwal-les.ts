import { queryOptions } from "@tanstack/react-query"
import { addDays, getDay, startOfDay } from "date-fns"

import { parseTime, WEEKDAYS } from "@/lib/data/jadwal"
import { httpClient, isApiError } from "@/lib/api"
import type { ChangeRequestForReview } from "@/types/jadwal"
import type {
  ChangeReview,
  Conflict,
  Pair,
  SaveScheduleInput,
  ScheduleBoard,
  ScheduleDraft,
  ScheduleSession,
} from "@/types/jadwal-les"

/*
 * Atur Jadwal Les (pengelola) · Figma PINTARA → UI Screen → Pengelola LBB
 * → P5 · Atur Jadwal Les
 *
 * Semua endpoint /pengelola/jadwal dan /pengelola/pengajuan-jadwal sudah
 * memakai BE. Pemeriksaan bentrok dilakukan BE (409 schedule_conflict).
 *
 * "Perlu dijadwalkan" = penawaran yang sudah diterima tutor (P4) tetapi
 * belum punya jadwal. "Pengajuan perubahan" berasal dari wali (W4).
 */
export const SESSION_MINUTES = 90
/* Jeda minimal antar sesi seorang tutor/siswa (perjalanan) */
export const BUFFER_MINUTES = 15
export const DAYS = WEEKDAYS.slice(1).concat(WEEKDAYS[0]) as string[]

/* ---------- Utilitas waktu ---------- */

const minutes = (time: string) => {
  const { hours, minutes: m } = parseTime(time)
  return hours * 60 + m
}

/* "16.00–17.30" */
export const formatRange = (s: Pick<ScheduleSession, "start" | "end">) =>
  `${s.start}–${s.end}`

/* "Rabu & Jumat · 16.00–17.30" · "Senin 19.00 · Kamis 20.15" */
export function formatSessions(sessions: ScheduleSession[]) {
  const sameTime = sessions.every(
    (s) => s.start === sessions[0].start && s.end === sessions[0].end
  )
  if (sameTime && sessions.length > 0) {
    return `${sessions.map((s) => s.day).join(" & ")} · ${formatRange(sessions[0])}`
  }
  return sessions.map((s) => `${s.day} ${s.start}`).join(" · ")
}

/* Tanggal berikutnya (mulai besok) untuk hari tertentu */
export function nextDate(day: string, from = new Date()) {
  const weekday = WEEKDAYS.indexOf(day as (typeof WEEKDAYS)[number])
  const base = addDays(startOfDay(from), 1)
  return addDays(base, (weekday - getDay(base) + 7) % 7)
}

/* ---------- Papan jadwal (tab Jadwal) ---------- */

/* Perlu dijadwalkan · pengajuan perubahan (paling lama dulu) · jadwal aktif */
export async function getScheduleBoard(): Promise<ScheduleBoard> {
  const { data } = await httpClient.get<ScheduleBoard>("/pengelola/jadwal")
  return data
}

export const scheduleBoardQuery = () =>
  queryOptions({ queryKey: ["jadwal-les", "papan"], queryFn: getScheduleBoard })

/* ---------- Form atur jadwal ---------- */

/* Jadwal baru dari penawaran yang diterima; 404 bila penawaran belum diterima */
export async function getScheduleDraft(
  offerId: string
): Promise<ScheduleDraft> {
  const { data } = await httpClient.get<ScheduleDraft>(
    `/pengelola/jadwal/draf/${encodeURIComponent(offerId)}`
  )
  return data
}

export const scheduleDraftQuery = (offerId: string) =>
  queryOptions({
    queryKey: ["jadwal-les", "draf", offerId],
    queryFn: () => getScheduleDraft(offerId),
  })

/* Ubah jadwal aktif; 404 bila pasangan tidak ditemukan */
export async function getPairDraft(pairId: string): Promise<ScheduleDraft> {
  const { data } = await httpClient.get<ScheduleDraft>(
    `/pengelola/jadwal/${encodeURIComponent(pairId)}`
  )
  return data
}

export const pairDraftQuery = (pairId: string) =>
  queryOptions({
    queryKey: ["jadwal-les", "pasangan", pairId],
    queryFn: () => getPairDraft(pairId),
  })

/* ---------- Cek bentrok & simpan ---------- */

/* Detail bentrok dari 409 schedule_conflict (dihitung BE, jeda BUFFER_MINUTES) */
export function scheduleConflictOf(error: unknown): Conflict | null {
  if (!isApiError(error) || error.serverCode !== "schedule_conflict") {
    return null
  }
  const conflict = (error.details as { conflict?: Conflict } | undefined)
    ?.conflict
  return conflict ?? null
}

/* Saran slot kosong di sekitar sesi yang bentrok: "selesai paling lambat 18.15 atau mulai 20.15" */
export function suggestFreeSlot(other: ScheduleSession) {
  const latestEnd = minutes(other.start) - BUFFER_MINUTES
  const earliestStart = minutes(other.end) + BUFFER_MINUTES
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`
  return `selesai paling lambat ${fmt(latestEnd)} atau mulai ${fmt(earliestStart)}`
}

/* 409 schedule_conflict (details.conflict) bila bentrok dengan jadwal lain */
export async function saveSchedule(input: SaveScheduleInput): Promise<Pair> {
  const { draft, sessions, effectiveFrom } = input
  const { data } = await httpClient.put<Pair>("/pengelola/jadwal", {
    draft,
    sessions,
    effectiveFrom,
  })
  return data
}

/* ---------- Tinjau pengajuan perubahan (W4 → P5) ---------- */

/* Pengajuan + sesi asal/tujuan + bentrok (dihitung BE); 404 bila tidak ada */
export async function getChangeReview(
  requestId: string
): Promise<ChangeReview> {
  const { data } = await httpClient.get<ChangeReview>(
    `/pengelola/pengajuan-jadwal/${encodeURIComponent(requestId)}`
  )
  return data
}

export const changeReviewQuery = (requestId: string) =>
  queryOptions({
    queryKey: ["jadwal-les", "pengajuan", requestId],
    queryFn: () => getChangeReview(requestId),
  })

/*
 * Setujui/tolak pengajuan. 409 schedule_conflict bila jadwal baru bentrok,
 * 409 already_processed bila sudah diputuskan.
 */
export async function reviewChangeRequest(
  requestId: string,
  approved: boolean
): Promise<ChangeRequestForReview> {
  const { data } = await httpClient.post<ChangeRequestForReview>(
    `/pengelola/pengajuan-jadwal/${encodeURIComponent(requestId)}`,
    { approved }
  )
  return data
}
