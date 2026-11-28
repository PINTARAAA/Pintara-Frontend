import { queryOptions } from "@tanstack/react-query"

import { getOfferTutorInfo } from "@/features/pencocokan/api"
import {
  NotFoundError,
  releaseMatch,
  snapshotRegistrations,
} from "@/features/verifikasi/api"
import { formatRequestedSchedule, formatShortAddress } from "@/features/verifikasi/lib"
import { httpClient } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { DECLINE_REASONS, offers } from "@/lib/data/penawaran"
import type {
  DeclineInput,
  DeclineReason,
  Offer,
  OfferDraft,
  OfferList,
} from "@/types/penawaran"
import type { PengelolaRegistration } from "@/types/verifikasi"

/*
 * Penawaran Tutor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P4 · Penawaran Tutor
 *
 * Sudah memakai BE: getOffers (GET /pengelola/penawaran).
 *
 * TODO(backend):
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

/* Belum dikirim · menunggu jawaban (paling lama dulu) · riwayat (terbaru dulu) */
export async function getOffers(): Promise<OfferList> {
  const { data } = await httpClient.get<OfferList>("/pengelola/penawaran")
  return data
}

export const offersQuery = () =>
  queryOptions({ queryKey: ["penawaran", "daftar"], queryFn: getOffers })

/* ---------- Buat penawaran ---------- */

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
