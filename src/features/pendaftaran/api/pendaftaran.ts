import { queryOptions } from "@tanstack/react-query"

import type { PendaftaranInput } from "@/features/pendaftaran/schemas"
import { httpClient, isApiError } from "@/lib/api"
import type {
  PendaftaranDefaults,
  PendaftaranResult,
  Registration,
  RegistrationStatusResult,
} from "@/types/pendaftaran"

/* 409 already_registered → ID pendaftaran aktif ("" bila BE tidak mengirimnya) */
export function alreadyRegisteredIdOf(error: unknown): string | null {
  if (!isApiError(error) || error.serverCode !== "already_registered") {
    return null
  }
  const id = (error.details as { registrationId?: unknown } | undefined)
    ?.registrationId
  return typeof id === "string" ? id : ""
}

export async function getPendaftaranDefaults(): Promise<PendaftaranDefaults> {
  const { data } = await httpClient.get<PendaftaranDefaults>(
    "/wali/pendaftaran/defaults"
  )
  return data
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
  const { data } = await httpClient.post<PendaftaranResult>(
    "/wali/pendaftaran",
    input
  )
  return data
}

export async function getRegistrationStatus(
  id?: string
): Promise<RegistrationStatusResult> {
  const { data } = await httpClient.get<RegistrationStatusResult>(
    id
      ? `/wali/pendaftaran/${encodeURIComponent(id)}`
      : "/wali/pendaftaran/terbaru"
  )
  return data
}

export const registrationStatusQuery = (id?: string) =>
  queryOptions({
    queryKey: ["pendaftaran", "status", id ?? "terbaru"],
    queryFn: () => getRegistrationStatus(id),
  })

/* Sementara hanya pendaftaran terbaru; BE belum punya daftar (temuan #1 di api-docs) */
export const ongoingRegistrationsQuery = () =>
  queryOptions({
    ...registrationStatusQuery(),
    select: ({ registration }): Registration[] =>
      registration &&
      (registration.stage === "menunggu_verifikasi" ||
        registration.stage === "pencocokan_tutor")
        ? [registration]
        : [],
  })
