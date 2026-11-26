export type RegistrationStage =
  | "menunggu_verifikasi"
  | "pencocokan_tutor"
  | "selesai"
  | "ditolak"

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
  /* Diisi setelah tutor ditemukan (tahap pencocokan selesai) */
  match?: { tutorName: string; matchedAt: Date }
  /* Diisi saat pendaftaran selesai: pertemuan pertama */
  firstSession?: { start: Date; confirmedAt: Date }
  rejection?: { reason: string; rejectedAt: Date }
}

/* Kontak Pengelola LBB untuk tautan "Hubungi Pengelola LBB" */
export type LbbContact = { name: string; whatsapp: string }

export type PendaftaranErrorCode = "already_registered"

export type PendaftaranResult = {
  id: string
  registrationNumber: string
  submittedAt: Date
  studentName: string
}

export type RegistrationStatus = {
  /* null = wali belum pernah mendaftarkan siswa */
  registration: Registration | null
  contact: LbbContact
}
