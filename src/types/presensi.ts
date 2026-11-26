import type { StatusOf } from "@/lib/constants/status"

export type ValidationStatus = Extract<
  StatusOf<"presensi">,
  "belum_divalidasi" | "sudah_divalidasi" | "keberatan"
>

export type AttendanceRecord = {
  held: boolean
  /* "HH.mm" — hanya bila terlaksana */
  actualStart?: string
  actualEnd?: string
  studentPresent?: boolean
  topic?: string
  notes?: string
  attachment?: { name: string; size: number }
  cancelReason?: string
  submittedAt: Date
  validation: ValidationStatus
  /* Diisi bila wali mengajukan keberatan (W5) */
  objection?: { reason: string; at: Date }
  /* Waktu wali menyetujui kehadiran */
  validatedAt?: Date
  /*
   * Hasil tinjauan keberatan oleh Pengelola (P6). corrected = waktu
   * pelaksanaan dikoreksi; false = data tutor dinyatakan sesuai.
   */
  review?: { corrected: boolean; note: string; at: Date }
  /* Verifikasi final Pengelola (P6): masuk rekap honor, tutor tak bisa ubah */
  finalAt?: Date
}

export type TutorSession = {
  id: string
  subject: string
  student: {
    name: string
    parentName: string
    /* Sapaan wali, mis. "Ibu" / "Bapak" */
    parentSalutation: string
  }
  start: Date
  end: Date
  record: AttendanceRecord | null
}

export type TutorSessionList = {
  /* Sesi yang sudah dimulai tetapi belum dipresensi */
  toFill: TutorSession[]
  /* Sesi hari ini yang belum dimulai */
  laterToday: TutorSession[]
  filled: TutorSession[]
}

export type AttendanceStatusOverview = {
  months: Date[]
  month: Date
  /* Sesi yang sudah dimulai pada bulan ini */
  total: number
  disputed: TutorSession[]
  waiting: TutorSession[]
  notCollected: TutorSession[]
  verified: TutorSession[]
}

export type TutorHistory = {
  months: Date[]
  month: Date
  /* Nama siswa yang diajar (untuk filter) */
  students: string[]
  /* null = semua siswa */
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
  /* Presensi lengkap per tutor, terbanyak dulu */
  readyByTutor: { tutor: string; count: number }[]
}

export type FinalByTutor = {
  tutor: string
  /* Jumlah presensi final per mapel */
  bySubject: Record<string, number>
  /* Rincian sesi (hanya tersedia untuk data per sesi, mis. Kak Budi) */
  sessions?: TutorSession[]
}
