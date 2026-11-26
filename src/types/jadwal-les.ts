import type { ChangeRequestForReview } from "@/types/jadwal"
import type { Offer } from "@/types/penawaran"

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

export type ScheduleBoard = {
  toSchedule: Offer[]
  requests: ChangeRequestForReview[]
  active: Pair[]
}

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

export type Conflict = {
  /* Indeks sesi di form (0 = Sesi 1) */
  index: number
  /* Siapa yang bentrok: tutor sudah mengajar, siswa sudah les, atau antar sesi */
  with: "tutor" | "siswa" | "sesi"
  other: ScheduleSession & { studentName?: string; tutorName?: string }
}

export type SaveScheduleInput = {
  draft: ScheduleDraft
  sessions: ScheduleSession[]
  effectiveFrom: Date
}

export type ChangeReview = {
  request: ChangeRequestForReview
  pair?: Pair
  fromSession: ScheduleSession
  toSession: ScheduleSession
  conflict: Conflict | null
}
