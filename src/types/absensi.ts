import type { StatusOf } from "@/lib/constants/status"

export type Attendance = "Hadir" | "Izin" | "Sakit" | "Tidak hadir"

export type SessionStatus = Extract<
  StatusOf<"presensi">,
  "belum_divalidasi" | "sudah_divalidasi" | "keberatan"
>

export type AttendanceSession = {
  id: string
  studentId: string
  studentName: string
  subject: string
  start: Date
  end: Date
  tutor: { name: string; initials: string }
  tutorAttendance: Attendance
  studentAttendance: Attendance
  topic: string
  notes: string
  attachments: string[]
  status: SessionStatus
  cancelReason?: string
  validatedAt?: Date
  objection?: { reason: string; submittedAt: Date }
  review?: { rating: number; comment: string; submittedAt: Date }
}

export type AttendanceOverview = {
  pending: AttendanceSession[]
  history: AttendanceSession[]
  multipleStudents: boolean
  unreadNotifications: number
}

export type LessonHistory = {
  students: { id: string; name: string }[]
  studentId: string
  months: Date[]
  month: Date
  sessions: AttendanceSession[]
  summary: {
    held: number
    cancelled: number
    upcoming: number
    bySubject: { subject: string; count: number }[]
  }
}
