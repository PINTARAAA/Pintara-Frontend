import { queryOptions } from "@tanstack/react-query"

import {
  PENGELOLA_MENU,
  TUTOR_ACCOUNT,
  WALI_ACCOUNT,
} from "@/lib/data/akun"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  PengelolaMenu,
  TutorAccount,
  WaliAccount,
} from "@/types/akun"

/*
 * Akun · Figma PINTARA → UI Screen → Wali Murid → W8 dan Tutor → T6
 *
 * TODO(backend):
 *   getWaliAccount()  → httpClient.get("/wali/akun")
 *   getTutorAccount() → httpClient.get("/tutor/akun")
 *   getPengelolaMenu() → httpClient.get("/pengelola/lainnya")
 *   logout()         → httpClient.post("/auth/logout") lalu hapus sesi lokal
 *
 * Data akun hanya bisa diubah oleh Pengelola LBB, jadi layar ini hanya baca.
 */

export async function getWaliAccount(): Promise<WaliAccount> {
  assertMockAllowed()
  await delay()
  return WALI_ACCOUNT
}

export const waliAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "wali"],
    queryFn: getWaliAccount,
    staleTime: 5 * 60_000,
  })

export async function getTutorAccount(): Promise<TutorAccount> {
  assertMockAllowed()
  await delay()
  return TUTOR_ACCOUNT
}

export const tutorAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "tutor"],
    queryFn: getTutorAccount,
    staleTime: 5 * 60_000,
  })

export async function getPengelolaMenu(): Promise<PengelolaMenu> {
  assertMockAllowed()
  await delay()
  return PENGELOLA_MENU
}

export const pengelolaMenuQuery = () =>
  queryOptions({
    queryKey: ["akun", "pengelola"],
    queryFn: getPengelolaMenu,
  })

export async function logout() {
  /* TODO(backend): panggil endpoint logout */
  await delay(300)
}
