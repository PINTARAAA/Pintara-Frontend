import type { PengelolaRegistration } from "@/types/verifikasi"

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
