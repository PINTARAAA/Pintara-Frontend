import { queryOptions } from "@tanstack/react-query"

import { NotFoundError, releaseMatch } from "@/features/verifikasi/api"
import { httpClient, isApiError } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { DECLINE_REASONS, offers } from "@/lib/data/penawaran"
import type {
  DeclineInput,
  DeclineReason,
  Offer,
  OfferDraft,
  OfferList,
} from "@/types/penawaran"

/*
 * Penawaran Tutor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P4 · Penawaran Tutor
 *
 * Sudah memakai BE: getOffers, getOfferDraft, sendOffer, getOffer,
 * recordAccepted.
 *
 * TODO(backend):
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

const OFFER_ERROR_CODES: readonly OfferError["code"][] = [
  "tutor_unavailable",
  "already_answered",
  "no_match",
  "already_sent",
]

/* Kode error penawaran dari BE (409) atau dari mock */
export function offerErrorCode(error: unknown): OfferError["code"] | null {
  if (error instanceof OfferError) return error.code
  if (!isApiError(error)) return null
  const code = error.serverCode as OfferError["code"] | undefined
  return code && OFFER_ERROR_CODES.includes(code) ? code : null
}

/* 409 already_sent → ID penawaran yang sudah ada (details.offerId) */
export function alreadySentOfferId(error: unknown): string | null {
  if (offerErrorCode(error) !== "already_sent") return null
  if (error instanceof OfferError) return error.offerId ?? null
  const id = isApiError(error)
    ? (error.details as { offerId?: unknown } | undefined)?.offerId
    : undefined
  return typeof id === "string" ? id : null
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

export async function getOfferDraft(
  registrationId: string
): Promise<OfferDraft> {
  const { data } = await httpClient.get<OfferDraft>(
    `/pengelola/penawaran/draf/${encodeURIComponent(registrationId)}`
  )
  return data
}

export const offerDraftQuery = (registrationId: string) =>
  queryOptions({
    queryKey: ["penawaran", "draf", registrationId],
    queryFn: () => getOfferDraft(registrationId),
    /* Ketersediaan tutor bisa berubah kapan saja */
    staleTime: 0,
  })

/* 409 tutor_unavailable bila slot tutor sudah terisi jadwal lain */
export async function sendOffer(
  registrationId: string,
  message: string
): Promise<Offer> {
  const { data } = await httpClient.post<Offer>("/pengelola/penawaran", {
    registrationId,
    ...(message.trim() && { message: message.trim() }),
  })
  return data
}

/*
 * Tutor tidak tersedia → lepas pilihan tutor dan kembali ke kandidat P3.
 * BE belum punya endpoint untuk melepas tutor terpilih (temuan #20 di
 * api-docs), jadi untuk sementara aksi ini ditolak dengan pesan yang jelas.
 */
export async function chooseAnotherTutor(): Promise<never> {
  throw new Error(
    "Memilih tutor lain belum didukung server. Hubungi tim backend."
  )
}

/* ---------- Detail & jawaban tutor ---------- */

function find(id: string) {
  const offer = offers.find((o) => o.id === id)
  if (!offer) throw new NotFoundError()
  return offer
}

export async function getOffer(id: string): Promise<Offer> {
  const { data } = await httpClient.get<Offer>(
    `/pengelola/penawaran/${encodeURIComponent(id)}`
  )
  return data
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

/* 409 already_answered bila jawaban tutor sudah dicatat */
export async function recordAccepted(id: string): Promise<Offer> {
  const { data } = await httpClient.post<Offer>(
    `/pengelola/penawaran/${encodeURIComponent(id)}/diterima`
  )
  return data
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
