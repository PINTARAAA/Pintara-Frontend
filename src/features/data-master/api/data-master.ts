import { queryOptions } from "@tanstack/react-query"

import {
  DAYS,
  DISTRICTS,
  LEVEL_GRADES,
  LEVELS,
  students,
  tutors,
} from "@/lib/data/data-master"
import { httpClient, isApiError } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  AccountStatus,
  Level,
  MasterFilter,
  Student,
  StudentRow,
  Tutor,
  TutorInput,
  TutorRow,
} from "@/types/data-master"

/*
 * Data Tutor & Siswa · Figma PINTARA → UI Screen → Pengelola LBB →
 * P9 · Data Tutor & Siswa
 *
 * Sudah memakai BE:
 *   getTutors(filter)            → GET /pengelola/tutor
 *   saveTutor(input)             → POST /pengelola/tutor (tambah)
 *   getTutor(id)                 → GET /pengelola/tutor/:id
 *
 * TODO(backend):
 *   saveTutor(input, id)         → httpClient.put(`/pengelola/tutor/${id}`, input)
 *   setTutorStatus(id, status)   → httpClient.patch(`/pengelola/tutor/${id}/status`, { status })
 *                                  (409 bila masih ada jadwal les aktif)
 *   getStudents(filter)          → httpClient.get("/pengelola/siswa", { params: filter })
 *   getStudent(id)               → httpClient.get(`/pengelola/siswa/${id}`)
 *   setStudentStatus(id, status) → httpClient.patch(`/pengelola/siswa/${id}/status`, { status })
 *
 * Tutor/siswa tidak dihapus, hanya dinonaktifkan agar riwayat les, presensi,
 * dan keuangan tetap utuh. Penonaktifan ditolak selama masih ada jadwal aktif.
 */

/* ---------- Format ---------- */

/* Gabungkan urutan yang bersambung jadi rentang: [Senin…Sabtu] → "Senin–Sabtu" */
function joinOrdered(values: readonly string[], order: readonly string[]) {
  const sorted = [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  const idx = sorted.map((v) => order.indexOf(v))
  const contiguous = idx.every((n, i) => i === 0 || n === idx[i - 1] + 1)
  if (sorted.length > 2 && contiguous) {
    return `${sorted[0]}–${sorted[sorted.length - 1]}`
  }
  if (sorted.length === 2 && contiguous && order === LEVELS) {
    return `${sorted[0]}–${sorted[1]}`
  }
  return sorted.join(", ")
}

export const formatDays = (days: readonly string[]) => joinOrdered(days, DAYS)
export const formatLevels = (levels: readonly Level[]) =>
  joinOrdered(levels, LEVELS)
/* "SMP (kelas 7–9)" · "SMP–SMA" */
export const formatLevelsLong = (levels: readonly Level[]) =>
  levels.length === 1
    ? `${levels[0]} (${LEVEL_GRADES[levels[0]]})`
    : formatLevels(levels)

export const initialsOf = (name: string) =>
  name
    .replace(/^Kak\s+/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

/* ---------- Tutor ---------- */

const matches = (text: string, query?: string) =>
  !query?.trim() || text.toLowerCase().includes(query.trim().toLowerCase())

/* Aktif dulu; urutan dalam status mengikuti data (terbaru ditambahkan di akhir) */
const byStatus = <T extends { status: AccountStatus }>(a: T, b: T) =>
  a.status === b.status ? 0 : a.status === "aktif" ? -1 : 1

/* Parameter filter BE: query, subject, district, status (kosong = semua) */
const filterParams = (filter: MasterFilter) => {
  const query = filter.query?.trim()
  return {
    ...(query && { query }),
    ...(filter.subject && { subject: filter.subject }),
    ...(filter.district && { district: filter.district }),
    ...(filter.status && { status: filter.status }),
  }
}

/* Tutor aktif dulu (urutan dari BE) */
export async function getTutors(filter: MasterFilter = {}): Promise<TutorRow[]> {
  const { data } = await httpClient.get<TutorRow[]>("/pengelola/tutor", {
    params: filterParams(filter),
  })
  return data
}

export const tutorsQuery = (filter: MasterFilter) =>
  queryOptions({
    queryKey: ["data-master", "tutor", "daftar", filter],
    queryFn: () => getTutors(filter),
  })

export class NotFoundError extends Error {
  constructor(what = "Data") {
    super(`${what} tidak ditemukan.`)
    this.name = "NotFoundError"
  }
}

/* 404 dari BE, atau dari mock (ubah/status tutor, siswa) */
export const isNotFoundError = (error: unknown) =>
  (isApiError(error) && error.code === "not_found") ||
  error instanceof NotFoundError

function findTutor(id: string) {
  const tutor = tutors.find((t) => t.id === id)
  if (!tutor) throw new NotFoundError("Tutor")
  return tutor
}

/* Profil lengkap + jumlah siswa & jadwal aktif */
export async function getTutor(id: string): Promise<Tutor> {
  const { data } = await httpClient.get<Tutor>(
    `/pengelola/tutor/${encodeURIComponent(id)}`
  )
  return data
}

export const tutorQuery = (id: string) =>
  queryOptions({
    queryKey: ["data-master", "tutor", "detail", id],
    queryFn: () => getTutor(id),
  })

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email sudah dipakai akun lain.")
    this.name = "DuplicateEmailError"
  }
}

/* 409 duplicate_field (email) dari BE, atau dari mock ubah tutor */
export const isDuplicateEmailError = (error: unknown) =>
  error instanceof DuplicateEmailError ||
  (isApiError(error) &&
    error.serverCode === "duplicate_field" &&
    (error.details as { field?: unknown } | undefined)?.field === "email")

/* Body TutorInputDto; BE menambah "Kak " dan menurunkan kecamatan dari alamat */
const tutorBody = (input: TutorInput) => ({
  ...input,
  name: input.name.trim(),
  email: input.email.trim().toLowerCase(),
  phone: input.phone.trim(),
  address: input.address.trim(),
})

const districtOf = (address: string) =>
  DISTRICTS.find((d) => address.toLowerCase().includes(d.toLowerCase())) ??
  "Bangkalan"

/*
 * Tambah: BE membuat akun login tutor (password sementara) sekaligus profil.
 * 409 duplicate_field bila email sudah dipakai akun lain.
 */
export async function saveTutor(input: TutorInput, id?: string): Promise<Tutor> {
  if (!id) {
    const { data } = await httpClient.post<Tutor>(
      "/pengelola/tutor",
      tutorBody(input)
    )
    return data
  }
  assertMockAllowed()
  await delay(800)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const email = input.email.trim().toLowerCase()
  if (tutors.some((t) => t.id !== id && t.email.toLowerCase() === email)) {
    throw new DuplicateEmailError()
  }
  const name = /^Kak\s/.test(input.name) ? input.name : `Kak ${input.name}`
  const fields = { ...input, name, email, district: districtOf(input.address) }

  const tutor = findTutor(id)
  Object.assign(tutor, fields)
  return structuredClone(tutor)
}

export class ActiveScheduleError extends Error {
  readonly schedules: number
  constructor(schedules: number) {
    super(`Masih ada ${schedules} jadwal les aktif.`)
    this.schedules = schedules
    this.name = "ActiveScheduleError"
  }
}

export async function setTutorStatus(
  id: string,
  status: AccountStatus
): Promise<Tutor> {
  assertMockAllowed()
  await delay(600)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const tutor = findTutor(id)
  if (status === "nonaktif" && tutor.activeSchedules > 0) {
    throw new ActiveScheduleError(tutor.activeSchedules)
  }
  tutor.status = status
  return structuredClone(tutor)
}

/* ---------- Siswa ---------- */

export async function getStudents(
  filter: MasterFilter = {}
): Promise<StudentRow[]> {
  assertMockAllowed()
  await delay()
  return students
    .filter(
      (s) =>
        (matches(s.name, filter.query) ||
          matches(s.guardian.name, filter.query)) &&
        (!filter.subject || s.subjects.includes(filter.subject)) &&
        (!filter.district || s.district === filter.district) &&
        (!filter.status || s.status === filter.status)
    )
    .sort(byStatus)
    .map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      subjects: s.subjects,
      status: s.status,
      endedAt: s.endedAt,
      tutorNames: [...new Set(s.lessons.map((l) => l.tutorName))],
    }))
}

export const studentsQuery = (filter: MasterFilter) =>
  queryOptions({
    queryKey: ["data-master", "siswa", "daftar", filter],
    queryFn: () => getStudents(filter),
  })

function findStudent(id: string) {
  const student = students.find((s) => s.id === id)
  if (!student) throw new NotFoundError("Siswa")
  return student
}

export async function getStudent(id: string): Promise<Student> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(findStudent(id))
}

export const studentQuery = (id: string) =>
  queryOptions({
    queryKey: ["data-master", "siswa", "detail", id],
    queryFn: () => getStudent(id),
  })

export async function setStudentStatus(
  id: string,
  status: AccountStatus
): Promise<Student> {
  assertMockAllowed()
  await delay(600)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const student = findStudent(id)
  if (status === "nonaktif" && student.lessons.length > 0) {
    throw new ActiveScheduleError(student.lessons.length)
  }
  student.status = status
  student.endedAt = status === "nonaktif" ? new Date() : undefined
  return structuredClone(student)
}
