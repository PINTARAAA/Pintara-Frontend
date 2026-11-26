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
  /* Diisi bila sesi tidak terlaksana (tidak perlu divalidasi), mis. "siswa sakit" */
  cancelReason?: string
  validatedAt?: Date
  objection?: { reason: string; submittedAt: Date }
  review?: { rating: number; comment: string; submittedAt: Date }
}

export type AttendanceOverview = {
  pending: AttendanceSession[]
  history: AttendanceSession[]
  /* Lebih dari satu anak → nama anak ditampilkan pada daftar */
  multipleStudents: boolean
  unreadNotifications: number
}

export type LessonHistory = {
  students: { id: string; name: string }[]
  studentId: string
  /* Bulan yang punya sesi (awal bulan), terbaru dulu */
  months: Date[]
  month: Date
  sessions: AttendanceSession[]
  summary: {
    held: number
    cancelled: number
    /* Sesi terjadwal dari besok sampai akhir bulan (bulan berjalan saja) */
    upcoming: number
    bySubject: { subject: string; count: number }[]
  }
}
