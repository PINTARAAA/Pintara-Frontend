import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import {
  studentDirectory,
  tutorDirectory,
  type AccountStatus,
} from "@/features/data-master/api/data-master"

/*
 * Manajemen Akun · Figma PINTARA → UI Screen → Pengelola LBB →
 * P10 · Manajemen Akun
 *
 * TODO(backend):
 *   getAccounts(peran, q)        → httpClient.get("/pengelola/akun", { params: { peran, q } })
 *   getAccount(id)               → httpClient.get(`/pengelola/akun/${id}`)
 *   saveAccount(input, id?)      → httpClient.post("/pengelola/akun", input)
 *                                  / httpClient.put(`/pengelola/akun/${id}`, input)
 *   resetPassword(id)            → httpClient.post(`/pengelola/akun/${id}/reset-password`)
 *   setAccountStatus(id, status) → httpClient.patch(`/pengelola/akun/${id}/status`, { status })
 *   linkStudents(id, siswaIds)   → httpClient.put(`/pengelola/akun/${id}/siswa`, { siswaIds })
 *
 * Password tidak pernah ditampilkan: akun baru dan reset password mengirim
 * password sementara ke email pengguna. Akun tutor mengikuti Data Tutor (P9).
 */
export type AccountRole = "wali" | "tutor" | "pengelola"

export const ROLE_LABEL: Record<AccountRole, string> = {
  wali: "Wali Murid",
  tutor: "Tutor",
  pengelola: "Pengelola LBB",
}

export type Account = {
  id: string
  role: AccountRole
  name: string
  email: string
  username: string
  phone: string
  createdAt: Date
  lastLoginAt: Date | null
  status: AccountStatus
  /* Wali saja: id siswa yang tertaut */
  studentIds: string[]
}

const usernameOf = (name: string) =>
  name
    .replace(/^Kak\s+/, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".")

/* ---------- Data contoh ---------- */

const accounts: Account[] = []

;(() => {
  const wali: [string, string, string[], AccountStatus, string?][] = [
    ["Sari Wulandari", "0812-3456-7890", ["sw-aisyah"], "aktif"],
    ["Hendra Wijaya", "0852-7788-9900", ["sw-bayu"], "aktif"],
    ["Rina Kartika", "0878-1100-2299", ["sw-salma", "sw-nadia"], "aktif"],
    ["Andi Saputra", "0813-4400-1122", [], "aktif"],
    ["Dewi Lestari", "0857-2211-3344", ["sw-rafi"], "nonaktif", "dewi.l@gmail.com"],
  ]
  wali.forEach(([name, phone, studentIds, status, email], i) =>
    accounts.push({
      id: `ak-wali-${i + 1}`,
      role: "wali",
      name,
      email: email ?? `${usernameOf(name)}@gmail.com`,
      username: usernameOf(name),
      phone,
      createdAt: at(-24 - i * 9, 9),
      lastLoginAt: i === 0 ? at(0, 11, 5) : status === "aktif" ? at(-i, 19, 30) : null,
      status,
      studentIds,
    })
  )

  /* Isi sampai 84 akun wali, ditautkan ke siswa yang tersisa */
  const first = ["Agus", "Bambang", "Dian", "Eka", "Fitri", "Gita", "Heri", "Indah", "Joko", "Kartini", "Lukman", "Maya"]
  const last = ["Setiawan", "Irawan", "Kartika", "Prasetyo", "Susanti", "Wahyudi", "Rahayu"]
  const linked = new Set(accounts.flatMap((a) => a.studentIds))
  const free = studentDirectory().filter((s) => !linked.has(s.id))
  for (let i = accounts.length; i < 84; i++) {
    const name = `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`
    const student = free[i]
    accounts.push({
      id: `ak-wali-${i + 1}`,
      role: "wali",
      name,
      email: `${usernameOf(name)}@gmail.com`,
      username: usernameOf(name),
      phone: `0812-${String(4000 + i * 29).slice(0, 4)}-${String(6000 + i * 13).slice(0, 4)}`,
      createdAt: at(-60 - i, 10),
      lastLoginAt: at(-(i % 14), 20),
      status: i >= 80 ? "nonaktif" : "aktif",
      studentIds: student ? [student.id] : [],
    })
  }

  for (const t of tutorDirectory()) {
    accounts.push({
      id: `ak-${t.id}`,
      role: "tutor",
      name: t.name,
      email: t.email,
      username: usernameOf(t.name),
      phone: t.phone,
      createdAt: t.joinedAt,
      lastLoginAt: t.status === "aktif" ? at(-1, 15, 40) : null,
      status: t.status,
      studentIds: [],
    })
  }

  accounts.push(
    {
      id: "ak-pengelola-1",
      role: "pengelola",
      name: "Ibu Ratna Sari",
      email: "ratna.pintara@gmail.com",
      username: "ratna.sari",
      phone: "0811-3000-1001",
      createdAt: new Date(2023, 5, 1),
      lastLoginAt: at(0, 7, 45),
      status: "aktif",
      studentIds: [],
    },
    {
      id: "ak-pengelola-2",
      role: "pengelola",
      name: "Pak Fahmi Ramadhan",
      email: "fahmi.pintara@gmail.com",
      username: "fahmi.ramadhan",
      phone: "0811-3000-1002",
      createdAt: new Date(2024, 1, 12),
      lastLoginAt: at(-2, 16, 10),
      status: "aktif",
      studentIds: [],
    }
  )
})()

/* ---------- Daftar ---------- */

export type AccountRow = Pick<
  Account,
  "id" | "role" | "name" | "email" | "status"
> & { students: number }

export type AccountList = {
  counts: Record<AccountRole, number>
  items: AccountRow[]
}

export async function getAccounts(
  role: AccountRole,
  query = ""
): Promise<AccountList> {
  assertMockAllowed()
  await delay()
  const q = query.trim().toLowerCase()
  const match = (a: Account) =>
    !q || [a.name, a.email, a.username].some((v) => v.toLowerCase().includes(q))
  const counts = { wali: 0, tutor: 0, pengelola: 0 }
  for (const a of accounts) if (match(a)) counts[a.role]++
  return {
    counts,
    items: accounts
      .filter((a) => a.role === role && match(a))
      /* Aktif dulu; urutan dalam status mengikuti data */
      .sort((a, b) =>
        a.status === b.status ? 0 : a.status === "aktif" ? -1 : 1
      )
      .map((a) => ({
        id: a.id,
        role: a.role,
        name: a.name,
        email: a.email,
        status: a.status,
        students: a.studentIds.length,
      })),
  }
}

export const accountsQuery = (role: AccountRole, query: string) =>
  queryOptions({
    queryKey: ["manajemen-akun", "daftar", role, query.trim()],
    queryFn: () => getAccounts(role, query),
  })

/* ---------- Detail ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Akun tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

export type LinkedStudent = { id: string; name: string; grade: string; status: AccountStatus }

export type AccountDetail = Account & { students: LinkedStudent[] }

function findAccount(id: string) {
  const account = accounts.find((a) => a.id === id)
  if (!account) throw new NotFoundError()
  return account
}

const withStudents = (a: Account): AccountDetail => {
  const directory = studentDirectory()
  return structuredClone({
    ...a,
    students: a.studentIds.flatMap((id) => {
      const s = directory.find((d) => d.id === id)
      return s ? [s] : []
    }),
  })
}

export async function getAccount(id: string): Promise<AccountDetail> {
  assertMockAllowed()
  await delay(300)
  return withStudents(findAccount(id))
}

export const accountQuery = (id: string) =>
  queryOptions({
    queryKey: ["manajemen-akun", "detail", id],
    queryFn: () => getAccount(id),
  })

/* Siswa untuk pilihan "Tautkan ke siswa" */
export async function getLinkableStudents(): Promise<LinkedStudent[]> {
  assertMockAllowed()
  await delay(200)
  return studentDirectory().filter((s) => s.status === "aktif")
}

export const linkableStudentsQuery = () =>
  queryOptions({
    queryKey: ["manajemen-akun", "siswa"],
    queryFn: getLinkableStudents,
  })

/* ---------- Simpan ---------- */

export type AccountInput = {
  role: AccountRole
  name: string
  email: string
  username: string
  phone: string
  studentIds: string[]
}

export class DuplicateFieldError extends Error {
  readonly field: "email" | "username"
  constructor(field: "email" | "username") {
    super(`${field === "email" ? "Email" : "Username"} sudah dipakai akun lain.`)
    this.name = "DuplicateFieldError"
    this.field = field
  }
}

const offline = () => {
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
}

export async function saveAccount(
  input: AccountInput,
  id?: string
): Promise<AccountDetail> {
  assertMockAllowed()
  await delay(800)
  offline()
  const email = input.email.trim().toLowerCase()
  const username = input.username.trim().toLowerCase()
  const others = accounts.filter((a) => a.id !== id)
  if (others.some((a) => a.email.toLowerCase() === email))
    throw new DuplicateFieldError("email")
  if (others.some((a) => a.username.toLowerCase() === username))
    throw new DuplicateFieldError("username")

  const fields = {
    ...input,
    name: input.name.trim(),
    email,
    username,
    studentIds: input.role === "wali" ? input.studentIds : [],
  }
  if (id) {
    const account = findAccount(id)
    Object.assign(account, fields)
    return withStudents(account)
  }
  const account: Account = {
    ...fields,
    id: `ak-${input.role}-${Date.now()}`,
    createdAt: new Date(),
    lastLoginAt: null,
    status: "aktif",
  }
  accounts.unshift(account)
  return withStudents(account)
}

export async function linkStudents(
  id: string,
  studentIds: string[]
): Promise<AccountDetail> {
  assertMockAllowed()
  await delay(600)
  offline()
  const account = findAccount(id)
  account.studentIds = studentIds
  return withStudents(account)
}

export async function resetPassword(id: string) {
  assertMockAllowed()
  await delay(700)
  offline()
  return { email: findAccount(id).email }
}

export async function setAccountStatus(id: string, status: AccountStatus) {
  assertMockAllowed()
  await delay(600)
  offline()
  const account = findAccount(id)
  account.status = status
  return withStudents(account)
}

export { usernameOf }
