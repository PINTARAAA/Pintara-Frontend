import { queryOptions } from "@tanstack/react-query"
import { addDays, getDay, isBefore, startOfDay } from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import {
  addMinutesToTime,
  decideChangeRequest,
  findRequestForReview,
  listRequestsForReview,
  parseTime,
  WEEKDAYS,
  type ChangeRequestForReview,
} from "@/features/jadwal/api/jadwal"
import { snapshotOffers, type Offer } from "@/features/penawaran/api/penawaran"
import {
  NotFoundError,
  snapshotRegistrations,
} from "@/features/verifikasi/api/verifikasi"

/*
 * Atur Jadwal Les (pengelola) · Figma PINTARA → UI Screen → Pengelola LBB
 * → P5 · Atur Jadwal Les
 *
 * TODO(backend):
 *   getScheduleBoard()          → httpClient.get("/pengelola/jadwal")
 *   getScheduleDraft(offerId)   → httpClient.get(`/pengelola/jadwal/draf/${offerId}`)
 *   getPair(pairId)             → httpClient.get(`/pengelola/jadwal/${pairId}`)
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

export type ScheduleSession = {
  subject: string
  /* "Senin" … "Minggu" */
  day: string
  /* "HH.mm" */
  start: string
  end: string
}

export type Pair = {
  id: string
  student: { name: string; grade: string; level: string }
  parentName: string
  tutor: { id: string; name: string; shortName: string }
  subjects: string[]
  sessions: ScheduleSession[]
  effectiveFrom: Date
  /* Penawaran asal (P4), bila ada */
  offerId?: string
}

/* ---------- Data contoh ---------- */

const pairs: Pair[] = [
  {
    id: "pr-aisyah",
    student: { name: "Aisyah Putri", grade: "8", level: "SMP" },
    parentName: "Sari Wulandari",
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["Matematika", "IPA"],
    sessions: [
      { subject: "Matematika", day: "Rabu", start: "16.00", end: "17.30" },
      { subject: "IPA", day: "Jumat", start: "16.00", end: "17.30" },
    ],
    effectiveFrom: at(-19, 0),
  },
  {
    id: "pr-bima",
    student: { name: "Bima Saputra", grade: "12", level: "SMA" },
    parentName: "Lina Marlina",
    tutor: { id: "tt-dimas", name: "Kak Dimas Arya", shortName: "Kak Dimas" },
    subjects: ["Fisika"],
    sessions: [
      { subject: "Fisika", day: "Kamis", start: "18.30", end: "20.00" },
    ],
    effectiveFrom: at(-40, 0),
  },
  {
    id: "pr-rizky",
    student: { name: "Rizky Ananda", grade: "10", level: "SMA" },
    parentName: "Dewi Ananda",
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["Matematika", "IPA"],
    sessions: [
      { subject: "IPA", day: "Selasa", start: "18.30", end: "20.00" },
      { subject: "Matematika", day: "Sabtu", start: "18.30", end: "20.00" },
    ],
    effectiveFrom: at(-21, 0),
    offerId: "pw-0002",
  },
  {
    id: "pr-dimas",
    student: { name: "Dimas Pratama", grade: "9", level: "SMP" },
    parentName: "Arif Pratama",
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["IPA", "Matematika"],
    sessions: [{ subject: "IPA", day: "Senin", start: "16.00", end: "17.30" }],
    effectiveFrom: at(-20, 0),
    offerId: "pw-0004",
  },
  {
    id: "pr-fikri",
    student: { name: "Fikri Ramadhan", grade: "5", level: "SD" },
    parentName: "Sari Wulandari",
    tutor: {
      id: "tt-nadia",
      name: "Kak Nadia Safitri",
      shortName: "Kak Nadia",
    },
    subjects: ["Bahasa Inggris"],
    sessions: [
      { subject: "Bahasa Inggris", day: "Kamis", start: "15.00", end: "16.30" },
    ],
    effectiveFrom: at(-30, 0),
  },
]

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

export type ScheduleBoard = {
  toSchedule: Offer[]
  requests: ChangeRequestForReview[]
  active: Pair[]
}

export async function getScheduleBoard(): Promise<ScheduleBoard> {
  assertMockAllowed()
  await delay()
  const scheduled = new Set(pairs.map((p) => p.offerId).filter(Boolean))
  return structuredClone({
    toSchedule: snapshotOffers()
      .filter((o) => o.status === "diterima" && !scheduled.has(o.id))
      .sort(
        (a, b) =>
          (a.answeredAt?.getTime() ?? 0) - (b.answeredAt?.getTime() ?? 0)
      ),
    requests: listRequestsForReview(),
    active: [...pairs].sort((a, b) =>
      a.student.name.localeCompare(b.student.name)
    ),
  })
}

export const scheduleBoardQuery = () =>
  queryOptions({ queryKey: ["jadwal-les", "papan"], queryFn: getScheduleBoard })

/* ---------- Form atur jadwal ---------- */

export type ScheduleDraft = {
  /* Ada bila mengubah jadwal aktif */
  pairId?: string
  offerId?: string
  student: Pair["student"]
  parentName: string
  tutor: Pair["tutor"]
  subjects: string[]
  /* "Senin & Kamis, 19.00 · 2× per minggu" (permintaan wali) */
  requested?: string
  sessions: ScheduleSession[]
  effectiveFrom: Date
}

/* Jadwal baru dari penawaran yang diterima */
export async function getScheduleDraft(
  offerId: string
): Promise<ScheduleDraft> {
  assertMockAllowed()
  await delay(300)
  const offer = snapshotOffers().find((o) => o.id === offerId)
  if (!offer || offer.status !== "diterima") throw new NotFoundError()
  const existing = pairs.find((p) => p.offerId === offerId)
  if (existing) return draftFromPair(existing)

  const registration = snapshotRegistrations().find(
    (r) => r.id === offer.registrationId
  )
  const needs = registration?.needs
  const perWeek = needs?.perWeek ?? offer.subjects.length
  const days = needs?.days ?? ["Senin"]
  const start = needs?.startTime ?? "16.00"
  const sessions = Array.from({ length: perWeek }, (_, i) => ({
    subject: offer.subjects[i % offer.subjects.length],
    day: days[i] ?? days[0],
    start,
    end: addMinutesToTime(start, SESSION_MINUTES),
  }))

  return {
    offerId,
    student: offer.student,
    parentName: registration?.parent.name ?? "wali",
    tutor: offer.tutor,
    subjects: offer.subjects,
    requested: needs && `${offer.schedule} · ${perWeek}× per minggu`,
    sessions,
    effectiveFrom: nextDate(sessions[0].day),
  }
}

export const scheduleDraftQuery = (offerId: string) =>
  queryOptions({
    queryKey: ["jadwal-les", "draf", offerId],
    queryFn: () => getScheduleDraft(offerId),
  })

function draftFromPair(pair: Pair): ScheduleDraft {
  return structuredClone({
    pairId: pair.id,
    offerId: pair.offerId,
    student: pair.student,
    parentName: pair.parentName,
    tutor: pair.tutor,
    subjects: pair.subjects,
    sessions: pair.sessions,
    effectiveFrom: isBefore(pair.effectiveFrom, new Date())
      ? nextDate(pair.sessions[0]?.day ?? "Senin")
      : pair.effectiveFrom,
  })
}

/* Ubah jadwal aktif */
export async function getPairDraft(pairId: string): Promise<ScheduleDraft> {
  assertMockAllowed()
  await delay(300)
  const pair = pairs.find((p) => p.id === pairId)
  if (!pair) throw new NotFoundError()
  return draftFromPair(pair)
}

export const pairDraftQuery = (pairId: string) =>
  queryOptions({
    queryKey: ["jadwal-les", "pasangan", pairId],
    queryFn: () => getPairDraft(pairId),
  })

/* ---------- Cek bentrok & simpan ---------- */

export type Conflict = {
  /* Indeks sesi di form (0 = Sesi 1) */
  index: number
  /* Siapa yang bentrok: tutor sudah mengajar, siswa sudah les, atau antar sesi */
  with: "tutor" | "siswa" | "sesi"
  other: ScheduleSession & { studentName?: string; tutorName?: string }
}

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

export type SaveScheduleInput = {
  draft: ScheduleDraft
  sessions: ScheduleSession[]
  effectiveFrom: Date
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

export type ChangeReview = {
  request: ChangeRequestForReview
  pair?: Pair
  fromSession: ScheduleSession
  toSession: ScheduleSession
  conflict: Conflict | null
}

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
