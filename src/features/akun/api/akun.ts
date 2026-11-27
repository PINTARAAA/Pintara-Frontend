import { queryOptions } from "@tanstack/react-query"

import { clearAccessToken, httpClient } from "@/lib/api"
import type {
  PengelolaMenu,
  TutorAccount,
  WaliAccount,
} from "@/types/akun"

export async function getWaliAccount(): Promise<WaliAccount> {
  const { data } = await httpClient.get<WaliAccount>("/wali/akun")
  return data
}

export const waliAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "wali"],
    queryFn: getWaliAccount,
    staleTime: 5 * 60_000,
  })

export async function getTutorAccount(): Promise<TutorAccount> {
  const { data } = await httpClient.get<TutorAccount>("/tutor/akun")
  return data
}

export const tutorAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "tutor"],
    queryFn: getTutorAccount,
    staleTime: 5 * 60_000,
  })

export async function getPengelolaMenu(): Promise<PengelolaMenu> {
  const { data } = await httpClient.get<PengelolaMenu>("/pengelola/lainnya")
  return data
}

export const pengelolaMenuQuery = () =>
  queryOptions({
    queryKey: ["akun", "pengelola"],
    queryFn: getPengelolaMenu,
  })

export async function logout() {
  try {
    await httpClient.post("/auth/logout")
  } catch {
    /* token tetap dihapus walau server tidak terjangkau */
  } finally {
    clearAccessToken()
  }
}
