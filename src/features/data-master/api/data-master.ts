import { queryOptions } from "@tanstack/react-query"

import {
  DAYS,
  LEVEL_GRADES,
  LEVELS,
} from "@/lib/data/data-master"
import { httpClient, isApiError } from "@/lib/api"
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
 *   saveTutor(input, id?)        → POST /pengelola/tutor · PUT /pengelola/tutor/:id
 *   getTutor(id)                 → GET /pengelola/tutor/:id
 *   setTutorStatus(id, status)   → PATCH /pengelola/tutor/:id/status
 *   getStudents(filter)          → GET /pengelola/siswa
 *   getStudent(id)               → GET /pengelola/siswa/:id
 *   setStudentStatus(id, status) → PATCH /pengelola/siswa/:id/status
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

/* 404 dari BE (tutor/siswa tidak ada) */
export const isNotFoundError = (error: unknown) =>
  isApiError(error) && error.code === "not_found"

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

/* 409 duplicate_field (email) dari BE */
export const isDuplicateEmailError = (error: unknown) =>
  isApiError(error) &&
  error.serverCode === "duplicate_field" &&
  (error.details as { field?: unknown } | undefined)?.field === "email"

/* Body TutorInputDto; BE menambah "Kak " dan menurunkan kecamatan dari alamat */
const tutorBody = (input: TutorInput) => ({
  ...input,
  name: input.name.trim(),
  email: input.email.trim().toLowerCase(),
  phone: input.phone.trim(),
  address: input.address.trim(),
})

/*
 * Tambah (POST) atau ubah (PUT). Tambah: BE membuat akun login tutor
 * (password sementara) sekaligus profil. 409 duplicate_field bila email
 * sudah dipakai akun lain.
 */
export async function saveTutor(input: TutorInput, id?: string): Promise<Tutor> {
  const body = tutorBody(input)
  const { data } = id
    ? await httpClient.put<Tutor>(`/pengelola/tutor/${encodeURIComponent(id)}`, body)
    : await httpClient.post<Tutor>("/pengelola/tutor", body)
  return data
}

/*
 * Jumlah jadwal aktif dari 409 active_schedule (BE: details.schedules);
 * null untuk error lain.
 */
export function activeSchedulesOf(error: unknown): number | null {
  if (!isApiError(error) || error.serverCode !== "active_schedule") return null
  const schedules = (error.details as { schedules?: unknown } | undefined)
    ?.schedules
  return typeof schedules === "number" ? schedules : 0
}

/* Menonaktifkan tutor juga menonaktifkan akun loginnya (BE) */
export async function setTutorStatus(
  id: string,
  status: AccountStatus
): Promise<Tutor> {
  const { data } = await httpClient.patch<Tutor>(
    `/pengelola/tutor/${encodeURIComponent(id)}/status`,
    { status }
  )
  return data
}

/* ---------- Siswa ---------- */

/* Pencarian `query` mencakup nama siswa dan nama wali; aktif dulu (BE) */
export async function getStudents(
  filter: MasterFilter = {}
): Promise<StudentRow[]> {
  const { data } = await httpClient.get<StudentRow[]>("/pengelola/siswa", {
    params: filterParams(filter),
  })
  return data
}

export const studentsQuery = (filter: MasterFilter) =>
  queryOptions({
    queryKey: ["data-master", "siswa", "daftar", filter],
    queryFn: () => getStudents(filter),
  })

/* Profil siswa + wali + jadwal les (semua pasangan tutor) */
export async function getStudent(id: string): Promise<Student> {
  const { data } = await httpClient.get<Student>(
    `/pengelola/siswa/${encodeURIComponent(id)}`
  )
  return data
}

export const studentQuery = (id: string) =>
  queryOptions({
    queryKey: ["data-master", "siswa", "detail", id],
    queryFn: () => getStudent(id),
  })

/* 409 active_schedule bila siswa masih punya jadwal les aktif */
export async function setStudentStatus(
  id: string,
  status: AccountStatus
): Promise<Student> {
  const { data } = await httpClient.patch<Student>(
    `/pengelola/siswa/${encodeURIComponent(id)}/status`,
    { status }
  )
  return data
}
