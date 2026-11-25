import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import { getOfferTutorInfo } from "@/features/pencocokan/api/pencocokan"
import {
  NotFoundError,
  releaseMatch,
  snapshotRegistrations,
  type PengelolaRegistration,
} from "@/features/verifikasi/api/verifikasi"
import {
  formatRequestedSchedule,
  formatShortAddress,
} from "@/features/verifikasi/lib/format"

/*
 * Penawaran Tutor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P4 · Penawaran Tutor
 *
 * TODO(backend):
 *   getOffers()                 → httpClient.get("/pengelola/penawaran")
 *   getOfferDraft(regId)        → httpClient.get(`/pengelola/penawaran/draf/${regId}`)
 *   sendOffer(regId, message)   → httpClient.post("/pengelola/penawaran", …)
 *   getOffer(id)                → httpClient.get(`/pengelola/penawaran/${id}`)
 *   recordAccepted(id)          → httpClient.post(`/pengelola/penawaran/${id}/diterima`)
 *   recordDeclined(id, input)   → httpClient.post(`/pengelola/penawaran/${id}/ditolak`, input)
 *   Petakan "slot tutor sudah terisi" ke OfferError("tutor_unavailable").
 *
 * Alur: P3 memilih tutor (registration.match) → pengelola mengirim penawaran
 * → tutor menjawab di luar aplikasi → pengelola mencatat jawabannya di sini.
 * Ditolak: tutor dilepas dan siswa kembali ke antrean pencocokan P3.
 */
export type OfferStatus = "menunggu_konfirmasi" | "diterima" | "ditolak"

export type DeclineReason =
  "jadwal_bentrok" | "lokasi_jauh" | "tidak_menguasai" | "lainnya"

export const DECLINE_REASONS: { value: DeclineReason; label: string }[] = [
  { value: "jadwal_bentrok", label: "Jadwal bentrok" },
  { value: "lokasi_jauh", label: "Lokasi terlalu jauh" },
  { value: "tidak_menguasai", label: "Tidak menguasai materi atau jenjang" },
  { value: "lainnya", label: "Lainnya" },
]

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

/* ---------- Data contoh ---------- */

const offers: Offer[] = [
  {
    id: "pw-0007",
    registrationId: "reg-0112",
    student: { name: "Salma Azzahra", grade: "7", level: "SMP" },
    tutor: {
      id: "tt-nadia",
      name: "Kak Nadia Safitri",
      shortName: "Kak Nadia",
    },
    subjects: ["Bahasa Inggris"],
    schedule: "Selasa & Jumat, 15.00",
    location: "Jl. Raya Tanjung Bumi",
    distanceKm: 1.8,
    rate: 50_000,
    sentAt: at(-4, 10, 0),
    status: "ditolak",
    answeredAt: at(-4, 16, 30),
    decline: {
      reason: "jadwal_bentrok",
      note: "Kak Nadia hanya bisa mengajar hari Jumat.",
    },
  },
  {
    id: "pw-0004",
    registrationId: "reg-0109",
    student: { name: "Dimas Pratama", grade: "9", level: "SMP" },
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["IPA", "Matematika"],
    schedule: "Senin & Kamis, 16.00",
    location: "Perum Kraton Indah",
    distanceKm: 2.6,
    rate: 60_000,
    sentAt: at(-22, 14, 0),
    status: "diterima",
    answeredAt: at(-22, 19, 10),
  },
  {
    id: "pw-0002",
    registrationId: "reg-0098",
    student: { name: "Rizky Ananda", grade: "10", level: "SMA" },
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["Matematika", "IPA"],
    schedule: "Selasa & Sabtu, 18.30",
    location: "Jl. Soekarno-Hatta",
    distanceKm: 3.2,
    rate: 60_000,
    sentAt: at(-24, 9, 0),
    status: "diterima",
    answeredAt: at(-23, 11, 20),
  },
]

export class OfferError extends Error {
  code: "tutor_unavailable" | "already_answered" | "no_match" | "already_sent"
  /* Penawaran yang sudah ada (already_sent) */
  offerId?: string
  constructor(
    code: OfferError["code"],
    message: string = code,
    offerId?: string
  ) {
    super(message)
    this.name = "OfferError"
    this.code = code
    this.offerId = offerId
  }
}

function ensureOnline() {
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
}

/* ---------- Daftar (tab Penawaran) ---------- */

export type OfferList = {
  /* Tutor sudah dipilih di P3 tetapi penawaran belum dikirim */
  unsent: { registration: PengelolaRegistration; tutorName: string }[]
  waiting: Offer[]
  history: Offer[]
}

export async function getOffers(): Promise<OfferList> {
  assertMockAllowed()
  await delay()

  const sentFor = new Set(
    offers
      .filter((o) => o.status !== "ditolak")
      .map((o) => `${o.registrationId}:${o.tutor.id}`)
  )
  const unsent = snapshotRegistrations()
    .filter(
      (r) =>
        r.status === "terverifikasi" &&
        r.match &&
        !sentFor.has(`${r.id}:${r.match.tutorId}`)
    )
    .map((r) => ({ registration: r, tutorName: r.match?.tutorName ?? "" }))

  const byNewest = (a: Offer, b: Offer) =>
    (b.answeredAt ?? b.sentAt).getTime() - (a.answeredAt ?? a.sentAt).getTime()

  return structuredClone({
    unsent,
    waiting: offers
      .filter((o) => o.status === "menunggu_konfirmasi")
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime()),
    history: offers
      .filter((o) => o.status !== "menunggu_konfirmasi")
      .sort(byNewest),
  })
}

export const offersQuery = () =>
  queryOptions({ queryKey: ["penawaran", "daftar"], queryFn: getOffers })

/* ---------- Buat penawaran ---------- */

export type OfferDraft = OfferSummary & {
  registration: PengelolaRegistration
  /* Isi bila slot tutor sudah terisi, mis. "Senin 19.00" */
  takenSlot: string | null
}

function buildDraft(registration: PengelolaRegistration): OfferDraft {
  if (registration.status !== "terverifikasi" || !registration.match) {
    throw new OfferError("no_match", "Belum ada tutor yang dipilih.")
  }
  const existing = offers.find(
    (o) =>
      o.registrationId === registration.id &&
      o.tutor.id === registration.match?.tutorId &&
      o.status !== "ditolak"
  )
  if (existing) {
    throw new OfferError(
      "already_sent",
      "Penawaran sudah dikirim.",
      existing.id
    )
  }
  const tutor = getOfferTutorInfo(registration.match.tutorId, registration)
  return {
    registration,
    registrationId: registration.id,
    student: {
      name: registration.student.name,
      grade: registration.student.grade,
      level: registration.student.level,
    },
    tutor: { id: tutor.id, name: tutor.name, shortName: tutor.shortName },
    subjects: registration.needs.subjects,
    schedule: formatRequestedSchedule(registration.needs),
    location: formatShortAddress(registration.student.address).split(",")[0],
    distanceKm: tutor.distanceKm,
    rate: tutor.rate,
    takenSlot: tutor.takenSlot,
  }
}

export async function getOfferDraft(
  registrationId: string
): Promise<OfferDraft> {
  assertMockAllowed()
  await delay(300)
  const registration = snapshotRegistrations().find(
    (r) => r.id === registrationId
  )
  if (!registration) throw new NotFoundError()
  return buildDraft(registration)
}

export const offerDraftQuery = (registrationId: string) =>
  queryOptions({
    queryKey: ["penawaran", "draf", registrationId],
    queryFn: () => getOfferDraft(registrationId),
    /* Ketersediaan tutor bisa berubah kapan saja */
    staleTime: 0,
  })

export async function sendOffer(
  registrationId: string,
  message: string
): Promise<Offer> {
  assertMockAllowed()
  await delay(800)
  ensureOnline()
  const registration = snapshotRegistrations().find(
    (r) => r.id === registrationId
  )
  if (!registration) throw new NotFoundError()
  const draft = buildDraft(registration)
  if (draft.takenSlot) {
    throw new OfferError(
      "tutor_unavailable",
      `${draft.tutor.shortName} tidak lagi tersedia.`
    )
  }

  const offer: Offer = {
    registrationId: draft.registrationId,
    student: draft.student,
    tutor: draft.tutor,
    subjects: draft.subjects,
    schedule: draft.schedule,
    location: draft.location,
    distanceKm: draft.distanceKm,
    rate: draft.rate,
    id: `pw-${Date.now()}`,
    message: message.trim() || undefined,
    sentAt: new Date(),
    status: "menunggu_konfirmasi",
  }
  offers.push(offer)
  return structuredClone(offer)
}

/* Tutor tidak tersedia: lepas pilihan agar bisa memilih tutor lain di P3 */
export async function chooseAnotherTutor(registrationId: string) {
  assertMockAllowed()
  await delay(300)
  return releaseMatch(registrationId)
}

/* ---------- Detail & jawaban tutor ---------- */

function find(id: string) {
  const offer = offers.find((o) => o.id === id)
  if (!offer) throw new NotFoundError()
  return offer
}

export async function getOffer(id: string): Promise<Offer> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(find(id))
}

export const offerQuery = (id: string) =>
  queryOptions({
    queryKey: ["penawaran", "detail", id],
    queryFn: () => getOffer(id),
  })

function findWaiting(id: string) {
  ensureOnline()
  const offer = find(id)
  if (offer.status !== "menunggu_konfirmasi") {
    throw new OfferError("already_answered", "Jawaban tutor sudah dicatat.")
  }
  return offer
}

export async function recordAccepted(id: string): Promise<Offer> {
  assertMockAllowed()
  await delay(600)
  const offer = findWaiting(id)
  offer.status = "diterima"
  offer.answeredAt = new Date()
  return structuredClone(offer)
}

export type DeclineInput = { reason: DeclineReason; note: string }

export async function recordDeclined(
  id: string,
  input: DeclineInput
): Promise<Offer> {
  assertMockAllowed()
  await delay(800)
  const offer = findWaiting(id)
  offer.status = "ditolak"
  offer.answeredAt = new Date()
  offer.decline = { reason: input.reason, note: input.note.trim() || undefined }
  /* Siswa kembali ke antrean pencocokan; tutor ini tidak dicalonkan lagi */
  releaseMatch(offer.registrationId, { declined: true })
  return structuredClone(offer)
}

export const declineLabel = (reason: DeclineReason) =>
  DECLINE_REASONS.find((r) => r.value === reason)?.label ?? "Lainnya"

/* Salinan semua penawaran (dibaca P5 · Atur Jadwal Les tanpa jeda) */
export function snapshotOffers() {
  return structuredClone(offers)
}
