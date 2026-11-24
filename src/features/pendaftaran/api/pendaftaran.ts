import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"
import type { PendaftaranInput } from "@/features/pendaftaran/schemas/pendaftaran-schema"

/*
 * Pendaftaran Siswa · Figma PINTARA → UI Screen → Wali Murid → W2
 *
 * TODO(backend):
 *   getPendaftaranDefaults() → httpClient.get("/wali/profil")
 *   submitPendaftaran()      → httpClient.post("/wali/pendaftaran", input)
 *   Petakan respons "siswa sudah terdaftar" ke
 *   PendaftaranError("already_registered") agar tampilan tidak perlu diubah.
 *
 * Selama backend belum ada (mode development):
 *   - nama siswa "Fikri Ramadhan" dianggap sudah memiliki pendaftaran aktif;
 *   - saat browser offline, pengiriman gagal (toast "gagal dikirim").
 */
export type PendaftaranErrorCode = "already_registered"

export class PendaftaranError extends Error {
  code: PendaftaranErrorCode

  constructor(code: PendaftaranErrorCode) {
    super(code)
    this.name = "PendaftaranError"
    this.code = code
  }
}

export type PendaftaranResult = {
  registrationNumber: string
  submittedAt: Date
  studentName: string
}

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

const ACTIVE_REGISTRATIONS = ["fikri ramadhan"]

export async function submitPendaftaran(
  input: PendaftaranInput
): Promise<PendaftaranResult> {
  assertMockAllowed()
  await delay(800)

  if (!navigator.onLine) {
    throw new Error("Tidak ada koneksi internet.")
  }
  if (ACTIVE_REGISTRATIONS.includes(input.studentName.trim().toLowerCase())) {
    throw new PendaftaranError("already_registered")
  }

  const now = new Date()
  return {
    registrationNumber: `REG-${now.getFullYear()}-${String(
      Math.floor(Math.random() * 10_000)
    ).padStart(4, "0")}`,
    submittedAt: now,
    studentName: input.studentName.trim(),
  }
}
