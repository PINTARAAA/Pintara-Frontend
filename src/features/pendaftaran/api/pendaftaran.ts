import { queryOptions } from "@tanstack/react-query"

import type { PendaftaranInput } from "@/features/pendaftaran/schemas"
import {
  figmaExample,
  LBB_CONTACT,
  PENDAFTARAN_DEFAULTS,
  registrations,
} from "@/lib/data/pendaftaran"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  PendaftaranErrorCode,
  PendaftaranResult,
  Registration,
  RegistrationStatusResult,
} from "@/types/pendaftaran"

/*
 * Pendaftaran Siswa · Figma PINTARA → UI Screen → Wali Murid → W2 & W3
 *
 * TODO(backend):
 *   getPendaftaranDefaults()  → httpClient.get("/wali/profil")
 *   submitPendaftaran()       → httpClient.post("/wali/pendaftaran", input)
 *   getRegistrationStatus(id) → httpClient.get("/wali/pendaftaran/terbaru")
 *                               atau `/wali/pendaftaran/${id}`
 *   Petakan respons "siswa sudah terdaftar" ke
 *   PendaftaranError("already_registered", id) agar tampilan tidak berubah.
 *
 * Selama backend belum ada (mode development), data disimpan di memori:
 *   - "Fikri Ramadhan" sudah punya pendaftaran aktif (uji error W2);
 *   - pendaftaran yang dikirim di W2 langsung tampil di W3;
 *   - saat browser offline, pengiriman gagal (toast "gagal dikirim");
 *   - /wali/pendaftaran/status?contoh=menunggu|pencocokan|selesai|ditolak|kosong
 *     menampilkan contoh tiap frame Figma W3.
 */

export class PendaftaranError extends Error {
  code: PendaftaranErrorCode
  /* Pendaftaran aktif yang sudah ada, untuk tautan "Lihat status" */
  registrationId?: string

  constructor(code: PendaftaranErrorCode, registrationId?: string) {
    super(code)
    this.name = "PendaftaranError"
    this.code = code
    this.registrationId = registrationId
  }
}

const isActive = (r: Registration) => r.stage !== "ditolak"

/* ---------- W2 · Pendaftaran ---------- */

export async function getPendaftaranDefaults(): Promise<{
  parentName: string
  parentPhone: string
}> {
  assertMockAllowed()
  await delay(300)
  return PENDAFTARAN_DEFAULTS
}

export const pendaftaranDefaultsQuery = () =>
  queryOptions({
    queryKey: ["pendaftaran", "defaults"],
    queryFn: getPendaftaranDefaults,
    staleTime: Infinity,
  })

export async function submitPendaftaran(
  input: PendaftaranInput
): Promise<PendaftaranResult> {
  assertMockAllowed()
  await delay(800)

  if (!navigator.onLine) {
    throw new Error("Tidak ada koneksi internet.")
  }
  const name = input.studentName.trim()
  const existing = registrations.find(
    (r) => isActive(r) && r.studentName.toLowerCase() === name.toLowerCase()
  )
  if (existing) {
    throw new PendaftaranError("already_registered", existing.id)
  }

  const now = new Date()
  const registration: Registration = {
    id: `reg-${now.getTime()}`,
    number: `REG-${now.getFullYear()}-${String(
      Math.floor(Math.random() * 10_000)
    ).padStart(4, "0")}`,
    studentName: name,
    grade: input.grade,
    subjects: input.subjects,
    days: input.days,
    startTime: input.startTime,
    stage: "menunggu_verifikasi",
    submittedAt: now,
  }
  registrations.push(registration)

  return {
    id: registration.id,
    registrationNumber: registration.number,
    submittedAt: registration.submittedAt,
    studentName: registration.studentName,
  }
}

/* ---------- W3 · Status Pendaftaran ---------- */

/*
 * Status satu pendaftaran. Tanpa `id`, tampilkan pendaftaran terbaru.
 * `example` hanya untuk development (lihat catatan di atas).
 */
export async function getRegistrationStatus(
  id?: string,
  example?: string
): Promise<RegistrationStatusResult> {
  assertMockAllowed()
  await delay()

  if (example) {
    return { registration: figmaExample(example), contact: LBB_CONTACT }
  }
  const registration = id
    ? registrations.find((r) => r.id === id)
    : registrations.at(-1)
  return { registration: registration ?? null, contact: LBB_CONTACT }
}

export const registrationStatusQuery = (id?: string, example?: string) =>
  queryOptions({
    queryKey: ["pendaftaran", "status", id ?? "terbaru", example ?? null],
    queryFn: () => getRegistrationStatus(id, example),
  })
