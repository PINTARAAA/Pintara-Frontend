import { queryOptions } from "@tanstack/react-query"

import { httpClient, isApiError } from "@/lib/api"
import { registrations } from "@/lib/data/verifikasi"
import type {
  Level,
  PengelolaRegistration,
  RegistrationList,
  RegistrationStatus,
  RejectInput,
} from "@/types/verifikasi"

/*
 * Verifikasi Pendaftaran (pengelola) · Figma PINTARA → UI Screen →
 * Pengelola LBB → P2 · Verifikasi Pendaftaran
 *
 * Daftar, detail, verifikasi, dan tolak sudah memakai BE (`/pengelola/pendaftaran`).
 * Bagian "P3 · Pencocokan Tutor" di bawah masih mock untuk modul pencocokan,
 * penawaran, dan jadwal-les sampai branch integrasinya masing-masing.
 */

/*
 * Bisa ditolak: masih menunggu verifikasi, atau sudah terverifikasi tetapi
 * belum ada tutor yang cocok (alternatif "Tolak pendaftaran" di P3).
 */
export const canReject = (r: PengelolaRegistration) =>
  r.status === "menunggu_verifikasi" ||
  (r.status === "terverifikasi" && !r.match)

/* Antre pencocokan: terverifikasi dan belum punya tutor */
export const needsTutor = (r: PengelolaRegistration) =>
  r.status === "terverifikasi" && !r.match

/* "Kelas 11 SMA" */
export const gradeLabel = (s: PengelolaRegistration["student"]) =>
  `Kelas ${s.grade} ${s.level}`

/* ---------- Error ---------- */

export const isNotFoundError = (error: unknown) =>
  (isApiError(error) && error.code === "not_found") ||
  error instanceof NotFoundError

/* 409 already_processed: sudah diverifikasi/ditolak (mis. oleh pengelola lain) */
export const isAlreadyProcessedError = (error: unknown) =>
  (isApiError(error) && error.serverCode === "already_processed") ||
  error instanceof AlreadyProcessedError

/* ---------- Daftar ---------- */

export async function getRegistrations(filter: {
  status: RegistrationStatus
  query?: string
  level?: Level
}): Promise<RegistrationList> {
  const q = filter.query?.trim()
  const { data } = await httpClient.get<RegistrationList>(
    "/pengelola/pendaftaran",
    {
      params: {
        status: filter.status,
        ...(q && { q }),
        ...(filter.level && { level: filter.level }),
      },
    }
  )
  return data
}

export const registrationsQuery = (filter: {
  status: RegistrationStatus
  query?: string
  level?: Level
}) =>
  queryOptions({
    queryKey: [
      "verifikasi",
      "daftar",
      filter.status,
      filter.query ?? "",
      filter.level ?? "semua",
    ],
    queryFn: () => getRegistrations(filter),
  })

/* ---------- Detail ---------- */

export async function getRegistration(
  id: string
): Promise<PengelolaRegistration> {
  const { data } = await httpClient.get<PengelolaRegistration>(
    `/pengelola/pendaftaran/${encodeURIComponent(id)}`
  )
  return data
}

export const registrationQuery = (id: string) =>
  queryOptions({
    queryKey: ["verifikasi", "detail", id],
    queryFn: () => getRegistration(id),
  })

/* ---------- Aksi ---------- */

/* Verifikasi: BE membuat data siswa dan mengirim notifikasi ke wali */
export async function verifyRegistration(
  id: string
): Promise<PengelolaRegistration> {
  const { data } = await httpClient.post<PengelolaRegistration>(
    `/pengelola/pendaftaran/${encodeURIComponent(id)}/verifikasi`
  )
  return data
}

export async function rejectRegistration(
  id: string,
  input: RejectInput
): Promise<PengelolaRegistration> {
  const { data } = await httpClient.post<PengelolaRegistration>(
    `/pengelola/pendaftaran/${encodeURIComponent(id)}/tolak`,
    { reason: input.reason, message: input.message.trim() }
  )
  return data
}

/* ---------- P3 · Pencocokan Tutor (mock, sementara) ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Pendaftaran tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

export class AlreadyProcessedError extends Error {
  constructor() {
    super("Pendaftaran sudah diproses.")
    this.name = "AlreadyProcessedError"
  }
}

function ensureOnline() {
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
}

function find(id: string) {
  const registration = registrations.find((r) => r.id === id)
  if (!registration) throw new NotFoundError()
  return registration
}

/* Salinan pendaftaran untuk modul pencocokan (dibaca tanpa jeda) */
export function snapshotRegistrations() {
  return structuredClone(registrations)
}

/* Tetapkan tutor terpilih; penawaran dikirim terpisah (P4) */
export function assignTutor(
  id: string,
  tutor: { id: string; name: string }
): PengelolaRegistration {
  ensureOnline()
  const registration = find(id)
  if (!needsTutor(registration)) throw new AlreadyProcessedError()
  registration.match = {
    tutorId: tutor.id,
    tutorName: tutor.name,
    at: new Date(),
  }
  return structuredClone(registration)
}

/*
 * Lepas tutor terpilih: penawaran ditolak tutor (declined) atau tutor tidak
 * lagi tersedia saat penawaran akan dikirim. Siswa kembali ke antrean P3.
 */
export function releaseMatch(id: string, options: { declined?: boolean } = {}) {
  const registration = find(id)
  if (registration.match && options.declined) {
    registration.declinedTutorIds = [
      ...(registration.declinedTutorIds ?? []),
      registration.match.tutorId,
    ]
  }
  registration.match = undefined
  return structuredClone(registration)
}
