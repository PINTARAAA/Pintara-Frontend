import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/lib/data/mock"
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
 * TODO(backend):
 *   getRegistrations()       → httpClient.get("/pengelola/pendaftaran")
 *   getRegistration(id)      → httpClient.get(`/pengelola/pendaftaran/${id}`)
 *   verifyRegistration(id)   → httpClient.post(`/pengelola/pendaftaran/${id}/verifikasi`)
 *   rejectRegistration(id,…) → httpClient.post(`/pengelola/pendaftaran/${id}/tolak`, input)
 *
 * Selama backend belum ada (mode development) data disimpan di memori:
 * hasil verifikasi/penolakan langsung memindahkan pendaftaran ke tab lain.
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

/* ---------- Daftar ---------- */

export async function getRegistrations(filter: {
  status: RegistrationStatus
  query?: string
  level?: Level
}): Promise<RegistrationList> {
  assertMockAllowed()
  await delay()

  const q = filter.query?.trim().toLowerCase() ?? ""
  const matches = (r: PengelolaRegistration) =>
    (!q ||
      r.student.name.toLowerCase().includes(q) ||
      r.parent.name.toLowerCase().includes(q)) &&
    (!filter.level || r.student.level === filter.level)

  const counts = { menunggu_verifikasi: 0, terverifikasi: 0, ditolak: 0 }
  registrations.forEach((r) => counts[r.status]++)

  /* Menunggu: paling lama menunggu dulu; tab lain: keputusan terbaru dulu */
  const decidedAt = (r: PengelolaRegistration) =>
    (r.verifiedAt ?? r.rejection?.at ?? r.submittedAt).getTime()
  const items = registrations
    .filter((r) => r.status === filter.status && matches(r))
    .sort((a, b) =>
      filter.status === "menunggu_verifikasi"
        ? a.submittedAt.getTime() - b.submittedAt.getTime()
        : decidedAt(b) - decidedAt(a)
    )

  return { counts, items: structuredClone(items) }
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

export class NotFoundError extends Error {
  constructor() {
    super("Pendaftaran tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

/* Pendaftaran sudah diverifikasi/ditolak (mis. oleh pengelola lain) */
export class AlreadyProcessedError extends Error {
  constructor() {
    super("Pendaftaran sudah diproses.")
    this.name = "AlreadyProcessedError"
  }
}

function find(id: string) {
  const registration = registrations.find((r) => r.id === id)
  if (!registration) throw new NotFoundError()
  return registration
}

export async function getRegistration(
  id: string
): Promise<PengelolaRegistration> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(find(id))
}

export const registrationQuery = (id: string) =>
  queryOptions({
    queryKey: ["verifikasi", "detail", id],
    queryFn: () => getRegistration(id),
  })

/* ---------- Aksi ---------- */

function ensureOnline() {
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
}

function findPending(id: string) {
  ensureOnline()
  const registration = find(id)
  if (registration.status !== "menunggu_verifikasi")
    throw new AlreadyProcessedError()
  return registration
}

/* Verifikasi: data siswa dibuat dan wali menerima notifikasi */
export async function verifyRegistration(
  id: string
): Promise<PengelolaRegistration> {
  assertMockAllowed()
  await delay(800)
  const registration = findPending(id)
  registration.status = "terverifikasi"
  registration.verifiedAt = new Date()
  return structuredClone(registration)
}

export async function rejectRegistration(
  id: string,
  input: RejectInput
): Promise<PengelolaRegistration> {
  assertMockAllowed()
  await delay(800)
  ensureOnline()
  const registration = find(id)
  if (!canReject(registration)) throw new AlreadyProcessedError()
  registration.status = "ditolak"
  registration.rejection = {
    reason: input.reason,
    message: input.message.trim(),
    at: new Date(),
  }
  return structuredClone(registration)
}

/* ---------- P3 · Pencocokan Tutor ---------- */

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
