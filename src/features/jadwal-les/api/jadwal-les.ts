import { queryOptions } from "@tanstack/react-query"
import { addDays, getDay, startOfDay } from "date-fns"

import {
  decideChangeRequest,
  findRequestForReview,
} from "@/features/jadwal/api"
import { addMinutesToTime, parseTime, WEEKDAYS } from "@/lib/data/jadwal"
import { pairs } from "@/lib/data/jadwal-les"
import { httpClient } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
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
 * Sudah memakai BE: getScheduleBoard, getScheduleDraft, getPairDraft.
 *
 * TODO(backend):
 *   saveSchedule(input)         → httpClient.put("/pengelola/jadwal", input)
 *   reviewChangeRequest(id, ok) → httpClient.post(`/pengelola/pengajuan-jadwal/${id}`, …)
 *   Petakan respons bentrok ke ScheduleConflictError.
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

const overlaps = (a: ScheduleSession, b: ScheduleSession) =>
  a.day === b.day &&
  minutes(a.start) < minutes(b.end) + BUFFER_MINUTES &&
  minutes(b.start) < minutes(a.end) + BUFFER_MINUTES

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

export class ScheduleConflictError extends Error {
  conflict: Conflict
  constructor(conflict: Conflict) {
    super("Jadwal bentrok.")
    this.name = "ScheduleConflictError"
    this.conflict = conflict
  }
}

export function findConflict(
  draft: Pick<ScheduleDraft, "pairId" | "student" | "tutor">,
  sessions: ScheduleSession[]
): Conflict | null {
  const others = pairs.filter((p) => p.id !== draft.pairId)
  for (const [index, session] of sessions.entries()) {
    const own = sessions.findIndex((s, i) => i < index && overlaps(s, session))
    if (own >= 0) {
      return { index, with: "sesi", other: sessions[own] }
    }
    for (const pair of others) {
      const hit = pair.sessions.find((s) => overlaps(s, session))
      if (!hit) continue
      if (pair.tutor.id === draft.tutor.id) {
        return {
          index,
          with: "tutor",
          other: { ...hit, studentName: pair.student.name },
        }
      }
      if (pair.student.name === draft.student.name) {
        return {
          index,
          with: "siswa",
          other: { ...hit, tutorName: pair.tutor.name },
        }
      }
    }
  }
  return null
}

/* Saran slot kosong di sekitar sesi yang bentrok: "selesai paling lambat 18.15 atau mulai 20.15" */
export function suggestFreeSlot(other: ScheduleSession) {
  const latestEnd = minutes(other.start) - BUFFER_MINUTES
  const earliestStart = minutes(other.end) + BUFFER_MINUTES
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`
  return `selesai paling lambat ${fmt(latestEnd)} atau mulai ${fmt(earliestStart)}`
}

export async function saveSchedule(input: SaveScheduleInput): Promise<Pair> {
  assertMockAllowed()
  await delay(800)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")

  const { draft, sessions, effectiveFrom } = input
  const conflict = findConflict(draft, sessions)
  if (conflict) throw new ScheduleConflictError(conflict)

  const existing = pairs.find((p) => p.id === draft.pairId)
  if (existing) {
    existing.sessions = structuredClone(sessions)
    existing.effectiveFrom = effectiveFrom
    return structuredClone(existing)
  }
  const pair: Pair = {
    id: `pr-${Date.now()}`,
    student: draft.student,
    parentName: draft.parentName,
    tutor: draft.tutor,
    subjects: draft.subjects,
    sessions: structuredClone(sessions),
    effectiveFrom,
    offerId: draft.offerId,
  }
  pairs.push(pair)
  return structuredClone(pair)
}

/* ---------- Tinjau pengajuan perubahan (W4 → P5) ---------- */

function buildReview(request: ChangeRequestForReview): ChangeReview {
  const pair = pairs.find(
    (p) =>
      p.student.name === request.studentName &&
      p.tutor.name === request.tutor.name
  )
  const fromSession: ScheduleSession = {
    subject: request.subject,
    day: WEEKDAYS[request.from.weekday],
    start: request.from.startTime,
    end: addMinutesToTime(request.from.startTime, request.durationMinutes),
  }
  const toSession: ScheduleSession = {
    subject: request.subject,
    day: WEEKDAYS[request.to.weekday],
    start: request.to.startTime,
    end: addMinutesToTime(request.to.startTime, request.durationMinutes),
  }
  /* Cek bentrok dengan jadwal lain, tanpa sesi yang sedang dipindah */
  const remaining =
    pair?.sessions.filter(
      (s) => !(s.day === fromSession.day && s.start === fromSession.start)
    ) ?? []
  const conflict = findConflict(
    {
      pairId: pair?.id,
      student: pair?.student ?? {
        name: request.studentName,
        grade: "",
        level: "",
      },
      tutor: pair?.tutor ?? {
        id: "",
        name: request.tutor.name,
        shortName: request.tutor.shortName,
      },
    },
    [...remaining, toSession]
  )
  return structuredClone({
    request,
    pair,
    fromSession,
    toSession,
    conflict: conflict && { ...conflict, index: 0 },
  })
}

export async function getChangeReview(
  requestId: string
): Promise<ChangeReview> {
  assertMockAllowed()
  await delay(300)
  return buildReview(findRequestForReview(requestId))
}

export const changeReviewQuery = (requestId: string) =>
  queryOptions({
    queryKey: ["jadwal-les", "pengajuan", requestId],
    queryFn: () => getChangeReview(requestId),
  })

export async function reviewChangeRequest(
  requestId: string,
  approved: boolean
) {
  assertMockAllowed()
  await delay(700)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const review = buildReview(findRequestForReview(requestId))
  if (approved && review.conflict) {
    throw new ScheduleConflictError(review.conflict)
  }
  const request = decideChangeRequest(requestId, approved)

  /* Perubahan seterusnya: jadwal pasangan ikut pindah */
  if (approved && request.scope === "seterusnya") {
    const pair = pairs.find((p) => p.id === review.pair?.id)
    const session = pair?.sessions.find(
      (s) =>
        s.day === review.fromSession.day && s.start === review.fromSession.start
    )
    if (session) Object.assign(session, review.toSession)
  }
  return request
}
