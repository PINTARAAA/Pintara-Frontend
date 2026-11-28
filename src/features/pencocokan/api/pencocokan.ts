import { queryOptions } from "@tanstack/react-query"

import { httpClient } from "@/lib/api"
import type { MatchingCandidates } from "@/types/pencocokan"
import type { PengelolaRegistration } from "@/types/verifikasi"

/*
 * Pencocokan Tutor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P3 · Pencocokan Tutor
 *
 * Antrean, kandidat, dan pilih tutor memakai BE: /pengelola/pencocokan(/:id).
 *
 * Kandidat dinilai BE dari 3 kriteria — mapel & jenjang, ketersediaan
 * hari/jam, dan jarak (maks. MAX_DISTANCE_KM) — ditambah rating tutor.
 */
export const MAX_DISTANCE_KM = 5

/* ---------- Format ---------- */

/* ["Senin", "Kamis"] → "Senin & Kamis" */
export const joinAnd = (items: string[]) =>
  items.length <= 2
    ? items.join(" & ")
    : `${items.slice(0, -1).join(", ")} & ${items.at(-1)}`

/* ---------- Antrean ---------- */

/* Terverifikasi & belum punya tutor; BE mengurutkan dari yang paling lama menunggu */
export async function getMatchingQueue(): Promise<PengelolaRegistration[]> {
  const { data } = await httpClient.get<PengelolaRegistration[]>(
    "/pengelola/pencocokan"
  )
  return data
}

export const matchingQueueQuery = () =>
  queryOptions({
    queryKey: ["pencocokan", "antrean"],
    queryFn: getMatchingQueue,
  })

/* ---------- Kandidat ---------- */

/* Kandidat dinilai BE (mapel & jenjang, hari/jam, jarak, rating) */
export async function getMatchingCandidates(
  id: string
): Promise<MatchingCandidates> {
  const { data } = await httpClient.get<MatchingCandidates>(
    `/pengelola/pencocokan/${encodeURIComponent(id)}`
  )
  return data
}

export const matchingCandidatesQuery = (id: string) =>
  queryOptions({
    queryKey: ["pencocokan", "kandidat", id],
    queryFn: () => getMatchingCandidates(id),
  })

/* ---------- Pilih tutor ---------- */

/* 409 already_processed bila siswa sudah punya tutor; 404 bila tutor tidak ada */
export async function selectTutor(
  registrationId: string,
  tutorId: string
): Promise<PengelolaRegistration> {
  const { data } = await httpClient.post<PengelolaRegistration>(
    `/pengelola/pencocokan/${encodeURIComponent(registrationId)}`,
    { tutorId }
  )
  return data
}
