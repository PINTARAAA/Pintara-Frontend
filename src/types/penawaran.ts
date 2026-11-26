import type { PengelolaRegistration } from "@/types/verifikasi"

export type OfferStatus = "menunggu_konfirmasi" | "diterima" | "ditolak"

export type DeclineReason =
  "jadwal_bentrok" | "lokasi_jauh" | "tidak_menguasai" | "lainnya"

export type OfferSummary = {
  registrationId: string
  student: { name: string; grade: string; level: string }
  tutor: { id: string; name: string; shortName: string }
  subjects: string[]
  schedule: string
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
  unsent: { registration: PengelolaRegistration; tutorName: string }[]
  waiting: Offer[]
  history: Offer[]
}

export type OfferDraft = OfferSummary & {
  registration: PengelolaRegistration
  takenSlot: string | null
}

export type DeclineInput = { reason: DeclineReason; note: string }
