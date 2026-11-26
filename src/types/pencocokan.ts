import type { Level } from "@/types/data-master"
import type { PengelolaRegistration } from "@/types/verifikasi"

export type MatchingTutor = {
  id: string
  name: string
  shortName: string
  initials: string
  education: string
  subjects: string[]
  levels: Level[]
  days: string[]
  from: string
  until: string
  rating: number
  activeStudents: number
  rate: number
  takenSlots?: string[]
  distanceKm: Record<string, number>
  defaultDistanceKm: number
}

export type Criterion = { label: string; met: boolean }

export type Candidate = {
  tutorId: string
  name: string
  shortName: string
  initials: string
  education: string
  rating: number
  activeStudents: number
  criteria: Criterion[]
  score: number
  fullMatch: boolean
}

export type MatchingCandidates = {
  registration: PengelolaRegistration
  candidates: Candidate[]
  fullMatches: number
}

export type OfferTutorInfo = {
  id: string
  name: string
  shortName: string
  rate: number
  distanceKm: number
  takenSlot: string | null
}
