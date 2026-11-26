import type { ChangeRequestForReview } from "@/types/jadwal"
import type { Offer } from "@/types/penawaran"

export type ScheduleSession = {
  subject: string
  day: string
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
  offerId?: string
}

export type ScheduleBoard = {
  toSchedule: Offer[]
  requests: ChangeRequestForReview[]
  active: Pair[]
}

export type ScheduleDraft = {
  pairId?: string
  offerId?: string
  student: Pair["student"]
  parentName: string
  tutor: Pair["tutor"]
  subjects: string[]
  requested?: string
  sessions: ScheduleSession[]
  effectiveFrom: Date
}

export type Conflict = {
  index: number
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
