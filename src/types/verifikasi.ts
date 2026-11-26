import type { Level } from "@/types/data-master"

export type { Level }

export type RegistrationStatus =
  "menunggu_verifikasi" | "terverifikasi" | "ditolak"

export type RejectReason =
  "di_luar_jangkauan" | "tutor_belum_tersedia" | "data_tidak_valid" | "lainnya"

export type PengelolaRegistration = {
  id: string
  number: string
  student: {
    name: string
    grade: string
    level: Level
    school: string
    address: string
  }
  parent: {
    name: string
    salutation: string
    whatsapp: string
    email: string
  }
  needs: {
    subjects: string[]
    perWeek: number
    days: string[]
    startTime: string
    notes?: string
  }
  submittedAt: Date
  status: RegistrationStatus
  verifiedAt?: Date
  rejection?: { reason: RejectReason; message: string; at: Date }
  match?: { tutorId: string; tutorName: string; at: Date }
  declinedTutorIds?: string[]
}

export type RegistrationList = {
  counts: Record<RegistrationStatus, number>
  items: PengelolaRegistration[]
}

export type RejectInput = { reason: RejectReason; message: string }
