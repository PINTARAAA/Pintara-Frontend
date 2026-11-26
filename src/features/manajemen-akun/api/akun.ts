import { queryOptions } from "@tanstack/react-query"

import { studentDirectory } from "@/lib/data/data-master"
import { accounts, usernameOf } from "@/lib/data/manajemen-akun"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type { AccountStatus } from "@/types/data-master"
import type {
  Account,
  AccountDetail,
  AccountInput,
  AccountList,
  AccountRole,
  LinkedStudent,
} from "@/types/manajemen-akun"

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

export const ROLE_LABEL: Record<AccountRole, string> = {
  wali: "Wali Murid",
  tutor: "Tutor",
  pengelola: "Pengelola LBB",
}

export { usernameOf }

/* ---------- Daftar ---------- */

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
