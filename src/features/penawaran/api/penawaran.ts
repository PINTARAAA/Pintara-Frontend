import { queryOptions } from "@tanstack/react-query"

import { httpClient, isApiError } from "@/lib/api"
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
 * Semua endpoint /pengelola/penawaran sudah memakai BE. `snapshotOffers`
 * (data mock `@/lib/data/penawaran`) masih dibaca modul jadwal-les sampai
 * branch integrasinya.
 *
 * Alur: P3 memilih tutor (registration.match) → pengelola mengirim penawaran
 * → tutor menjawab di luar aplikasi → pengelola mencatat jawabannya di sini.
 * Ditolak: tutor dilepas dan siswa kembali ke antrean pencocokan P3.
 */

/* Kode error 409 dari BE untuk alur penawaran */
export type OfferErrorCode =
  "tutor_unavailable" | "already_answered" | "no_match" | "already_sent"

const OFFER_ERROR_CODES: readonly OfferErrorCode[] = [
  "tutor_unavailable",
  "already_answered",
  "no_match",
  "already_sent",
]

export function offerErrorCode(error: unknown): OfferErrorCode | null {
  if (!isApiError(error)) return null
  const code = error.serverCode as OfferErrorCode | undefined
  return code && OFFER_ERROR_CODES.includes(code) ? code : null
}

/* 409 already_sent → ID penawaran yang sudah ada (details.offerId) */
export function alreadySentOfferId(error: unknown): string | null {
  if (offerErrorCode(error) !== "already_sent" || !isApiError(error)) {
    return null
  }
  const id = (error.details as { offerId?: unknown } | undefined)?.offerId
  return typeof id === "string" ? id : null
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

/* 409 already_answered bila jawaban tutor sudah dicatat */
export async function recordAccepted(id: string): Promise<Offer> {
  const { data } = await httpClient.post<Offer>(
    `/pengelola/penawaran/${encodeURIComponent(id)}/diterima`
  )
  return data
}

/* BE melepas tutor; siswa kembali ke antrean pencocokan tanpa tutor ini */
export async function recordDeclined(
  id: string,
  input: DeclineInput
): Promise<Offer> {
  const { data } = await httpClient.post<Offer>(
    `/pengelola/penawaran/${encodeURIComponent(id)}/ditolak`,
    {
      reason: input.reason,
      ...(input.note.trim() && { note: input.note.trim() }),
    }
  )
  return data
}

export const declineLabel = (reason: DeclineReason) =>
  DECLINE_REASONS.find((r) => r.value === reason)?.label ?? "Lainnya"

/* Salinan semua penawaran (dibaca P5 · Atur Jadwal Les tanpa jeda) */
export function snapshotOffers() {
  return structuredClone(offers)
}
