import { queryOptions } from "@tanstack/react-query"

import {
  assignTutor,
  needsTutor,
  NotFoundError,
  snapshotRegistrations,
} from "@/features/verifikasi/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { tutors } from "@/lib/data/pencocokan"
import type {
  Candidate,
  Criterion,
  MatchingCandidates,
  MatchingTutor,
  OfferTutorInfo,
} from "@/types/pencocokan"
import type { PengelolaRegistration } from "@/types/verifikasi"

/*
 * Pencocokan Tutor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P3 · Pencocokan Tutor
 *
 * TODO(backend):
 *   getMatchingQueue()       → httpClient.get("/pengelola/pencocokan")
 *   getMatchingCandidates(id)→ httpClient.get(`/pengelola/pencocokan/${id}`)
 *   selectTutor(id, tutorId) → httpClient.post(`/pengelola/pencocokan/${id}`, { tutorId })
 *
 * Selama backend belum ada (mode development) antrean diambil dari data
 * Verifikasi Pendaftaran (P2): siswa terverifikasi yang belum punya tutor.
 * Kandidat dinilai dari 3 kriteria — mapel & jenjang, ketersediaan
 * hari/jam, dan jarak (maks. 5 km) — ditambah rating tutor.
 */
export const MAX_DISTANCE_KM = 5

/* ---------- Penilaian ---------- */

const minutes = (time: string) => {
  const [h, m] = time.split(/[.:]/).map(Number)
  return h * 60 + m
}

/* ["Senin", "Kamis"] → "Senin & Kamis" */
export const joinAnd = (items: string[]) =>
  items.length <= 2
    ? items.join(" & ")
    : `${items.slice(0, -1).join(", ")} & ${items.at(-1)}`

const km = (value: number) =>
  value.toLocaleString("id-ID", { maximumFractionDigits: 1 })

function evaluate(tutor: MatchingTutor, r: PengelolaRegistration): Candidate {
  const { level } = r.student
  const { subjects, days, startTime } = r.needs

  /* 1 · Mapel & jenjang */
  const teachesLevel = tutor.levels.includes(level)
  const covered = teachesLevel
    ? subjects.filter((s) => tutor.subjects.includes(s))
    : []
  const missing = subjects.filter((s) => !covered.includes(s))
  const subjectCriterion: Criterion =
    missing.length === 0
      ? { label: `${joinAnd(subjects)} ${level}`, met: true }
      : covered.length > 0
        ? {
            label: `${joinAnd(covered)} ${level} · belum mengajar ${joinAnd(missing)}`,
            met: false,
          }
        : { label: `Belum mengajar ${joinAnd(subjects)} ${level}`, met: false }

  /* 2 · Ketersediaan hari & jam */
  const start = minutes(startTime)
  const fitsTime =
    start >= minutes(tutor.from) && start + 90 <= minutes(tutor.until)
  const openDays = fitsTime ? days.filter((d) => tutor.days.includes(d)) : []
  const dayCriterion: Criterion =
    openDays.length === days.length
      ? { label: `Tersedia ${joinAnd(days)}, ${startTime}`, met: true }
      : openDays.length > 0
        ? { label: `Hanya tersedia ${joinAnd(openDays)}`, met: false }
        : { label: `Tidak tersedia ${joinAnd(days)}, ${startTime}`, met: false }

  /* 3 · Jarak */
  const distance = tutor.distanceKm[r.id] ?? tutor.defaultDistanceKm
  const near = distance <= MAX_DISTANCE_KM
  const distanceCriterion: Criterion = near
    ? { label: `Jarak ${km(distance)} km dari alamat les`, met: true }
    : {
        label: `Jarak ${km(distance)} km · di atas batas ${MAX_DISTANCE_KM} km`,
        met: false,
      }

  const subjectRatio = covered.length / subjects.length
  const dayRatio = openDays.length / days.length
  const distancePoints = near ? 20 - distance * 2 : Math.max(0, 10 - distance)
  const ratingPoints = Math.max(0, (tutor.rating - 4.5) * 20)
  const score = Math.round(
    Math.min(
      100,
      subjectRatio * 40 + dayRatio * 30 + distancePoints + ratingPoints
    )
  )
  const criteria = [subjectCriterion, dayCriterion, distanceCriterion]

  return {
    tutorId: tutor.id,
    name: tutor.name,
    shortName: tutor.shortName,
    initials: tutor.initials,
    education: tutor.education,
    rating: tutor.rating,
    activeStudents: tutor.activeStudents,
    criteria,
    score,
    fullMatch: criteria.every((c) => c.met),
  }
}

/* ---------- Antrean ---------- */

export async function getMatchingQueue(): Promise<PengelolaRegistration[]> {
  assertMockAllowed()
  await delay()
  /* Yang paling lama menunggu tutor tampil paling atas */
  return snapshotRegistrations()
    .filter(needsTutor)
    .sort(
      (a, b) => (a.verifiedAt?.getTime() ?? 0) - (b.verifiedAt?.getTime() ?? 0)
    )
}

export const matchingQueueQuery = () =>
  queryOptions({
    queryKey: ["pencocokan", "antrean"],
    queryFn: getMatchingQueue,
  })

/* ---------- Kandidat ---------- */

export async function getMatchingCandidates(
  id: string
): Promise<MatchingCandidates> {
  assertMockAllowed()
  await delay(400)
  const registration = snapshotRegistrations().find((r) => r.id === id)
  if (!registration) throw new NotFoundError()

  const declined = registration.declinedTutorIds ?? []
  const candidates = tutors
    .filter((t) => !declined.includes(t.id))
    .map((t) => evaluate(t, registration))
    .filter((c) => !c.criteria[0].label.startsWith("Belum mengajar"))
    .sort(
      (a, b) => Number(b.fullMatch) - Number(a.fullMatch) || b.score - a.score
    )

  return {
    registration,
    candidates,
    fullMatches: candidates.filter((c) => c.fullMatch).length,
  }
}

export const matchingCandidatesQuery = (id: string) =>
  queryOptions({
    queryKey: ["pencocokan", "kandidat", id],
    queryFn: () => getMatchingCandidates(id),
  })

/* ---------- Pilih tutor ---------- */

export async function selectTutor(registrationId: string, tutorId: string) {
  assertMockAllowed()
  await delay(800)
  const tutor = tutors.find((t) => t.id === tutorId)
  if (!tutor) throw new Error("Tutor tidak ditemukan.")
  return assignTutor(registrationId, { id: tutor.id, name: tutor.name })
}

/* ---------- Untuk penawaran (P4) ---------- */

export function getOfferTutorInfo(
  tutorId: string,
  registration: PengelolaRegistration
): OfferTutorInfo {
  const tutor = tutors.find((t) => t.id === tutorId)
  if (!tutor) throw new Error("Tutor tidak ditemukan.")
  const slots = registration.needs.days.map(
    (d) => `${d} ${registration.needs.startTime}`
  )
  return {
    id: tutor.id,
    name: tutor.name,
    shortName: tutor.shortName,
    rate: tutor.rate,
    distanceKm: tutor.distanceKm[registration.id] ?? tutor.defaultDistanceKm,
    takenSlot: slots.find((slot) => tutor.takenSlots?.includes(slot)) ?? null,
  }
}
