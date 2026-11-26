import { queryOptions } from "@tanstack/react-query"
import { nextWednesday, setHours, startOfDay } from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api"
import type {
  LbbContact,
  Registration,
} from "@/features/pendaftaran/api/types"
import type { PendaftaranInput } from "@/features/pendaftaran/schemas"

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
export type PendaftaranErrorCode = "already_registered"

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

export type PendaftaranResult = {
  id: string
  registrationNumber: string
  submittedAt: Date
  studentName: string
}

/* ---------- Data contoh ---------- */

const LBB_CONTACT: LbbContact = {
  name: "Pengelola LBB Jelajah Ilmu",
  whatsapp: "6281234567890",
}

const registrations: Registration[] = [
  {
    id: "reg-fikri",
    number: "REG-2026-0098",
    studentName: "Fikri Ramadhan",
    grade: "5 SD",
    subjects: ["Bahasa Inggris"],
    days: ["Selasa", "Kamis"],
    startTime: "15.00",
    stage: "pencocokan_tutor",
    submittedAt: at(-3, 9, 20),
    verifiedAt: at(-2, 13, 5),
  },
]

/* Contoh sesuai frame Figma W3 (siswa Aisyah Putri) */
function figmaExample(stage: string): Registration | null {
  const base: Registration = {
    id: "contoh",
    number: "REG-2026-0112",
    studentName: "Aisyah Putri",
    grade: "8 SMP",
    subjects: ["Matematika", "IPA"],
    days: ["Rabu", "Jumat"],
    startTime: "16.00",
    stage: "menunggu_verifikasi",
    submittedAt: at(-4, 10, 15),
  }
  switch (stage) {
    case "menunggu":
      return base
    case "pencocokan":
      return { ...base, stage: "pencocokan_tutor", verifiedAt: at(-3, 9) }
    case "selesai":
      return {
        ...base,
        stage: "selesai",
        verifiedAt: at(-3, 9),
        match: { tutorName: "Kak Budi Santoso", matchedAt: at(-1, 14, 30) },
        /* Rabu berikutnya pukul 16.00, sesuai jadwal yang diminta */
        firstSession: {
          start: setHours(startOfDay(nextWednesday(new Date())), 16),
          confirmedAt: at(0, 8),
        },
      }
    case "ditolak":
      return {
        ...base,
        stage: "ditolak",
        rejection: {
          reason:
            "Alamat les berada di luar jangkauan layanan tutor LBB Jelajah Ilmu.",
          rejectedAt: at(-3, 9),
        },
      }
    default:
      return null
  }
}

const isActive = (r: Registration) => r.stage !== "ditolak"

/* ---------- W2 · Pendaftaran ---------- */

/* Data wali dari akun, untuk mengisi awal langkah 1 */
export async function getPendaftaranDefaults(): Promise<{
  parentName: string
  parentPhone: string
}> {
  assertMockAllowed()
  await delay(300)
  return { parentName: "Sari Wulandari", parentPhone: "0812-3456-7890" }
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

export type RegistrationStatus = {
  /* null = wali belum pernah mendaftarkan siswa */
  registration: Registration | null
  contact: LbbContact
}

/*
 * Status satu pendaftaran. Tanpa `id`, tampilkan pendaftaran terbaru.
 * `example` hanya untuk development (lihat catatan di atas).
 */
export async function getRegistrationStatus(
  id?: string,
  example?: string
): Promise<RegistrationStatus> {
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
