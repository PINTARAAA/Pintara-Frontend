import type { PengelolaRegistration } from "@/types/verifikasi"

export type OfferStatus = "menunggu_konfirmasi" | "diterima" | "ditolak"

export type DeclineReason =
  | "jadwal_bentrok"
  | "lokasi_jauh"
  | "tidak_menguasai"
  | "lainnya"

/* Ringkasan yang ikut tersimpan pada penawaran (tidak berubah setelah dikirim) */
export type OfferSummary = {
  registrationId: string
  student: { name: string; grade: string; level: string }
  tutor: { id: string; name: string; shortName: string }
  subjects: string[]
  /* "Senin & Kamis, 19.00" */
  schedule: string
  /* "Perum Griya Utama" */
  location: string
  distanceKm: number
  rate: number
}

export type Offer = OfferSummary & {
  id: string
  message?: string
  sentAt: Date
  status: OfferStatus
  answeredAt?: Date
  decline?: { reason: DeclineReason; note?: string }
}

export type OfferList = {
  /* Tutor sudah dipilih di P3 tetapi penawaran belum dikirim */
  unsent: { registration: PengelolaRegistration; tutorName: string }[]
  waiting: Offer[]
  history: Offer[]
}

export type OfferDraft = OfferSummary & {
  registration: PengelolaRegistration
  /* Isi bila slot tutor sudah terisi, mis. "Senin 19.00" */
  takenSlot: string | null
}

export type DeclineInput = { reason: DeclineReason; note: string }
