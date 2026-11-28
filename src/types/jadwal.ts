import type { WaliStudent } from "@/types/dashboard"

export type ScheduleTutor = { name: string; shortName: string }

export type Routine = {
  id: string
  studentId: string
  subject: string
  weekday: number
  startTime: string
  durationMinutes: number
  tutor: ScheduleTutor
  location: string
  since: Date
}

export type ChangeRequestStatus =
  "ditinjau_pengelola" | "konfirmasi_tutor" | "disetujui" | "ditolak"

export type ChangeRequest = {
  id: string
  routineId: string
  studentId: string
  subject: string
  tutor: ScheduleTutor
  durationMinutes: number
  from: { weekday: number; startTime: string }
  to: { weekday: number; startTime: string }
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
  startTime: string
  durationMinutes: number
  student: { name: string; grade: string }
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
  week: number
  weeks: { from: Date; to: Date }[]
  days: TutorScheduleDay[]
  freeDays: string[]
}

/*
 * Detail sesi dari GET /tutor/jadwal/:id. BE memakai bentuk detail presensi,
 * jadi routineId, kelas siswa, dan alamat belum dikirim (temuan #23 di
 * api-docs); FE melengkapinya dari jadwal mingguan bila sesi masih dalam
 * 4 minggu ke depan.
 */
export type TutorScheduleDetail = {
  id: string
  /* ID pasangan tutor–siswa (dipakai POST /tutor/pengajuan-jadwal) */
  routineId?: string
  subject: string
  start: Date
  end: Date
  student: { name: string; grade?: string }
  address?: string
  parent: TutorRoutine["parent"] & { whatsapp: string }
  previous: {
    date: Date
    subject: string
    topic?: string
    notes?: string
  } | null
}
