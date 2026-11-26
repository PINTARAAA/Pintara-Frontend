import type { StatusOf } from "@/lib/constants/status"

export type ValidationStatus = Extract<
  StatusOf<"presensi">,
  "belum_divalidasi" | "sudah_divalidasi" | "keberatan"
>

export type AttendanceRecord = {
  held: boolean
  actualStart?: string
  actualEnd?: string
  studentPresent?: boolean
  topic?: string
  notes?: string
  attachment?: { name: string; size: number }
  cancelReason?: string
  submittedAt: Date
  validation: ValidationStatus
  objection?: { reason: string; at: Date }
  validatedAt?: Date
  review?: { corrected: boolean; note: string; at: Date }
  finalAt?: Date
}

export type TutorSession = {
  id: string
  subject: string
  student: {
    name: string
    parentName: string
    parentSalutation: string
  }
  start: Date
  end: Date
  record: AttendanceRecord | null
}

export type TutorSessionList = {
  toFill: TutorSession[]
  laterToday: TutorSession[]
  filled: TutorSession[]
}

export type AttendanceStatusOverview = {
  months: Date[]
  month: Date
  total: number
  disputed: TutorSession[]
  waiting: TutorSession[]
  notCollected: TutorSession[]
  verified: TutorSession[]
}

export type TutorHistory = {
  months: Date[]
  month: Date
  students: string[]
  student: string | null
  sessions: TutorSession[]
  summary: {
    held: number
    cancelled: number
    studentCount: number
    byStudent: { name: string; count: number }[]
  }
}

export type ObjectionResolution =
  | { corrected: true; actualStart: string; actualEnd: string; note: string }
  | { corrected: false; note: string }

export type AttendanceErrorCode = "already_filled" | "not_started"

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

export type Counts = {
  final: number
  ready: number
  waiting: number
  notCollected: number
}

export type FinalOverview = {
  months: Date[]
  month: Date
  total: number
  final: number
  ready: number
  waiting: number
  disputed: number
  notCollected: number
  objections: TutorSession[]
  readyByTutor: { tutor: string; count: number }[]
}

export type FinalByTutor = {
  tutor: string
  bySubject: Record<string, number>
  sessions?: TutorSession[]
}
