import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"
import {
  assignTutor,
  needsTutor,
  NotFoundError,
  snapshotRegistrations,
  type Level,
  type PengelolaRegistration,
} from "@/features/verifikasi/api/verifikasi"

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

type Tutor = {
  id: string
  name: string
  /* Nama sapaan untuk tombol, mis. "Kak Dimas" */
  shortName: string
  initials: string
  education: string
  subjects: string[]
  levels: Level[]
  /* Hari mengajar dan rentang jam "HH.mm" */
  days: string[]
  from: string
  until: string
  rating: number
  activeStudents: number
  /* Tarif tutor per sesi (Rupiah) */
  rate: number
  /*
   * Slot yang baru saja terisi siswa lain, mis. "Senin 19.00". Belum
   * tercermin di kriteria ketersediaan (data jadwal tersinkron berkala),
   * jadi baru ketahuan saat penawaran akan dikirim (P4 · Error).
   */
  takenSlots?: string[]
  /* Jarak ke alamat les per pendaftaran (dari layanan peta di backend) */
  distanceKm: Record<string, number>
  defaultDistanceKm: number
}

/* ---------- Data contoh ---------- */

const tutors: Tutor[] = [
  {
    id: "tt-dimas",
    name: "Kak Dimas Arya",
    shortName: "Kak Dimas",
    initials: "DA",
    education: "S1 Pendidikan Fisika · Univ. Trunojoyo",
    subjects: ["Fisika", "Matematika"],
    levels: ["SMP", "SMA"],
    days: ["Senin", "Selasa", "Kamis"],
    from: "16.00",
    until: "21.00",
    rating: 4.8,
    activeStudents: 4,
    rate: 60_000,
    distanceKm: { "reg-0115": 2.1 },
    defaultDistanceKm: 4.2,
  },
  {
    id: "tt-laila",
    name: "Kak Laila Fitri",
    shortName: "Kak Laila",
    initials: "LF",
    education: "S1 Matematika · Univ. Negeri Surabaya",
    subjects: ["Matematika"],
    levels: ["SD", "SMP", "SMA"],
    days: ["Kamis", "Sabtu"],
    from: "15.00",
    until: "21.00",
    rating: 4.9,
    activeStudents: 6,
    rate: 55_000,
    distanceKm: { "reg-0115": 3.4 },
    defaultDistanceKm: 3.1,
  },
  {
    id: "tt-yoga",
    name: "Kak Yoga Pratama",
    shortName: "Kak Yoga",
    initials: "YP",
    education: "S1 Fisika · ITS",
    subjects: ["Fisika", "Matematika"],
    levels: ["SMA"],
    days: ["Senin", "Rabu", "Kamis"],
    from: "18.00",
    until: "21.00",
    rating: 4.6,
    activeStudents: 2,
    rate: 65_000,
    takenSlots: ["Senin 19.00"],
    distanceKm: { "reg-0115": 6.8 },
    defaultDistanceKm: 7.5,
  },
  {
    id: "tt-nadia",
    name: "Kak Nadia Safitri",
    shortName: "Kak Nadia",
    initials: "NS",
    education: "S1 Pendidikan Bahasa Inggris · Univ. Trunojoyo",
    subjects: ["Bahasa Inggris"],
    levels: ["SD", "SMP"],
    days: ["Kamis", "Jumat"],
    from: "15.00",
    until: "18.00",
    rating: 4.7,
    activeStudents: 5,
    rate: 50_000,
    distanceKm: { "reg-0112": 1.8 },
    defaultDistanceKm: 2.5,
  },
  {
    id: "tt-rina",
    name: "Kak Rina Oktavia",
    shortName: "Kak Rina",
    initials: "RO",
    education: "S1 Sastra Inggris · Univ. Airlangga",
    subjects: ["Bahasa Inggris"],
    levels: ["SMP", "SMA"],
    days: ["Selasa", "Jumat"],
    from: "14.00",
    until: "17.00",
    rating: 4.5,
    activeStudents: 3,
    rate: 50_000,
    distanceKm: { "reg-0112": 8.2 },
    defaultDistanceKm: 6.4,
  },
]

/* ---------- Penilaian ---------- */

export type Criterion = { label: string; met: boolean }

export type Candidate = {
  tutorId: string
  name: string
  shortName: string
  initials: string
  education: string
  rating: number
  activeStudents: number
  criteria: Criterion[]
  /* 0–100 */
  score: number
  /* Semua kriteria terpenuhi */
  fullMatch: boolean
}

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

function evaluate(tutor: Tutor, r: PengelolaRegistration): Candidate {
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

export type MatchingCandidates = {
  registration: PengelolaRegistration
  /* Tutor yang mengajar minimal satu mapel di jenjang ini, skor tertinggi dulu */
  candidates: Candidate[]
  fullMatches: number
}

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

export type OfferTutorInfo = {
  id: string
  name: string
  shortName: string
  rate: number
  distanceKm: number
  /* Slot jadwal diminta yang sudah terisi siswa lain, mis. "Senin 19.00" */
  takenSlot: string | null
}

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
