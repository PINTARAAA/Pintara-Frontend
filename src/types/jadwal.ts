import type { WaliStudent } from "@/types/dashboard"

export type Tutor = { name: string; shortName: string }

/* Jadwal rutin mingguan satu mata pelajaran */
export type Routine = {
  id: string
  studentId: string
  subject: string
  weekday: number
  /* "HH.mm" */
  startTime: string
  durationMinutes: number
  tutor: Tutor
  location: string
  since: Date
}

export type ChangeRequestStatus =
  | "ditinjau_pengelola"
  | "konfirmasi_tutor"
  | "disetujui"
  | "ditolak"

export type ChangeRequest = {
  id: string
  routineId: string
  studentId: string
  subject: string
  tutor: Tutor
  durationMinutes: number
  from: { weekday: number; startTime: string }
  to: { weekday: number; startTime: string }
  /* sekali = hanya sesi terdekat; seterusnya = mulai `effectiveDate` */
  scope: "sekali" | "seterusnya"
  effectiveDate: Date
  reason: string
  status: ChangeRequestStatus
  submittedAt: Date
}

export type Session = {
  id: string
  routineId: string
  subject: string
  start: Date
  end: Date
  tutorName: string
}

export type WaliSchedule = {
  students: WaliStudent[]
  activeStudentId: string
  pendingRequests: ChangeRequest[]
  week: { from: Date; to: Date; sessions: Session[] }
  routines: Routine[]
  unreadNotifications: number
}

export type RoutineDetail = Routine & {
  studentName: string
  nextSession: Date
  /* Pengajuan perubahan yang masih diproses untuk jadwal ini */
  pendingRequest: ChangeRequest | null
}

export type ChangeRequestForReview = ChangeRequest & {
  studentName: string
  parentName: string
}

export type TutorRoutine = {
  id: string
  subject: string
  weekday: number
  /* "HH.mm" */
  startTime: string
  durationMinutes: number
  student: { name: string; grade: string }
  /* Alamat lengkap; bagian sebelum koma tampil di daftar */
  address: string
  parent: { name: string; phone: string }
}

export type TutorScheduleSession = {
  id: string
  routineId: string
  subject: string
  start: Date
  end: Date
  student: TutorRoutine["student"]
  address: string
  shortAddress: string
}

export type TutorScheduleDay = {
  date: Date
  sessions: TutorScheduleSession[]
}

export type TutorSchedule = {
  /* 0 = minggu ini (7 hari mulai hari ini) */
  week: number
  weeks: { from: Date; to: Date }[]
  days: TutorScheduleDay[]
  /* Nama hari tanpa les dalam rentang minggu, mis. ["Kamis", "Minggu"] */
  freeDays: string[]
}

export type TutorScheduleDetail = TutorScheduleSession & {
  parent: TutorRoutine["parent"] & { whatsapp: string }
  previous: { date: Date; subject: string; topic?: string; notes?: string } | null
}
