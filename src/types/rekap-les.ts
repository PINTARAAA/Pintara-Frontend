import type { StatusOf } from "@/lib/constants/status"

export type SessionStatus = StatusOf<"presensi"> | "tidak_terlaksana"

export type RecapSession = {
  id: string
  date: Date
  subject: string
  topic: string | null
  tutorId: string
  tutorName: string
  studentId: string
  studentName: string
  status: SessionStatus
}

export type RecapFilter = {
  month?: Date
  tutorId?: string
  studentId?: string
}

export type TutorSummary = {
  id: string
  name: string
  sessions: number
  missed: number
  students: number
}

export type StudentSummary = {
  id: string
  name: string
  sessions: number
  missed: number
  tutors: string[]
}

export type LessonRecap = {
  months: Date[]
  month: Date
  tutorOptions: { id: string; name: string }[]
  studentOptions: { id: string; name: string }[]
  held: number
  missed: number
  pairs: number
  byTutor: TutorSummary[]
  byStudent: StudentSummary[]
  /* Riwayat sesi sesuai filter, terbaru dulu */
  sessions: RecapSession[]
}
