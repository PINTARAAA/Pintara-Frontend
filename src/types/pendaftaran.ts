export type RegistrationStage =
  "menunggu_verifikasi" | "pencocokan_tutor" | "selesai" | "ditolak"

export type Registration = {
  id: string
  number: string
  studentName: string
  grade: string
  subjects: string[]
  days: string[]
  startTime: string
  stage: RegistrationStage
  submittedAt: Date
  verifiedAt?: Date
  match?: { tutorName: string; matchedAt: Date }
  firstSession?: { start: Date; confirmedAt: Date }
  rejection?: { reason: string; rejectedAt: Date }
}

export type RegistrationLbbContact = { name: string; whatsapp: string }

export type PendaftaranErrorCode = "already_registered"

export type PendaftaranResult = {
  id: string
  registrationNumber: string
  submittedAt: Date
  studentName: string
}

export type RegistrationStatusResult = {
  registration: Registration | null
  contact: RegistrationLbbContact
}
