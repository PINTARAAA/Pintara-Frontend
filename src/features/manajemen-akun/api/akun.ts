import { queryOptions } from "@tanstack/react-query"

import { httpClient, isApiError } from "@/lib/api"
import type { AccountStatus } from "@/types/data-master"
import type {
  AccountDetail,
  AccountInput,
  AccountList,
  AccountRole,
  LinkedStudent,
} from "@/types/manajemen-akun"

export const ROLE_LABEL: Record<AccountRole, string> = {
  wali: "Wali Murid",
  tutor: "Tutor",
  pengelola: "Pengelola LBB",
}

export const usernameOf = (name: string) =>
  name
    .replace(/^Kak\s+/, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".")

export const isNotFoundError = (error: unknown) =>
  isApiError(error) && error.code === "not_found"

export function duplicateFieldOf(error: unknown): "email" | "username" | null {
  if (!isApiError(error) || error.serverCode !== "duplicate_field") return null
  const field = (error.details as { field?: unknown } | undefined)?.field
  return field === "email" || field === "username" ? field : null
}

export async function getAccounts(
  role: AccountRole,
  query = ""
): Promise<AccountList> {
  const q = query.trim()
  const { data } = await httpClient.get<AccountList>("/pengelola/akun", {
    params: { peran: role, ...(q && { q }) },
  })
  return data
}

export const accountsQuery = (role: AccountRole, query: string) =>
  queryOptions({
    queryKey: ["manajemen-akun", "daftar", role, query.trim()],
    queryFn: () => getAccounts(role, query),
  })

export async function getAccount(id: string): Promise<AccountDetail> {
  const { data } = await httpClient.get<AccountDetail>(`/pengelola/akun/${id}`)
  return data
}

export const accountQuery = (id: string) =>
  queryOptions({
    queryKey: ["manajemen-akun", "detail", id],
    queryFn: () => getAccount(id),
  })

export async function getLinkableStudents(): Promise<LinkedStudent[]> {
  const { data } = await httpClient.get<LinkedStudent[]>("/pengelola/akun/siswa")
  return data
}

export const linkableStudentsQuery = () =>
  queryOptions({
    queryKey: ["manajemen-akun", "siswa"],
    queryFn: getLinkableStudents,
  })

export async function saveAccount(
  input: AccountInput,
  id?: string
): Promise<AccountDetail> {
  const body = {
    ...input,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    username: input.username.trim().toLowerCase(),
    studentIds: input.role === "wali" ? input.studentIds : [],
  }
  const { data } = id
    ? await httpClient.put<AccountDetail>(`/pengelola/akun/${id}`, body)
    : await httpClient.post<AccountDetail>("/pengelola/akun", body)
  return data
}

export async function linkStudents(
  id: string,
  studentIds: string[]
): Promise<AccountDetail> {
  const { data } = await httpClient.put<AccountDetail>(
    `/pengelola/akun/${id}/siswa`,
    { siswaIds: studentIds }
  )
  return data
}

export async function resetPassword(id: string): Promise<{ email: string }> {
  const { data } = await httpClient.post<{ email: string }>(
    `/pengelola/akun/${id}/reset-password`
  )
  return data
}

export async function setAccountStatus(
  id: string,
  status: AccountStatus
): Promise<AccountDetail> {
  const { data } = await httpClient.patch<AccountDetail>(
    `/pengelola/akun/${id}/status`,
    { status }
  )
  return data
}
