import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"

/*
 * Akun · Figma PINTARA → UI Screen → Wali Murid → W8 dan Tutor → T6
 *
 * TODO(backend):
 *   getWaliAccount()  → httpClient.get("/wali/akun")
 *   getTutorAccount() → httpClient.get("/tutor/akun")
 *   logout()         → httpClient.post("/auth/logout") lalu hapus sesi lokal
 *
 * Data akun hanya bisa diubah oleh Pengelola LBB, jadi layar ini hanya baca.
 */
export type LbbContact = { name: string; whatsapp: string; display: string }

const LBB_CONTACT: LbbContact = {
  name: "Kak Ila",
  whatsapp: "6281200001122",
  display: "0812-0000-1122",
}

const APP_VERSION = "1.0.0"

export type WaliAccount = {
  name: string
  initials: string
  role: string
  email: string
  whatsapp: string
  username: string
  students: { id: string; name: string; grade: string; subjects: string[] }[]
  lbbContact: LbbContact
  appVersion: string
}

export async function getWaliAccount(): Promise<WaliAccount> {
  assertMockAllowed()
  await delay()

  return {
    name: "Sari Wulandari",
    initials: "SW",
    role: "Wali Murid",
    email: "sari.wulandari@gmail.com",
    whatsapp: "0812-3456-7890",
    username: "sari.wulandari",
    students: [
      { id: "s1", name: "Aisyah Putri", grade: "Kelas 8 SMP", subjects: ["Matematika", "IPA"] },
      { id: "s2", name: "Fikri Ramadhan", grade: "Kelas 5 SD", subjects: ["Bahasa Inggris"] },
    ],
    lbbContact: LBB_CONTACT,
    appVersion: APP_VERSION,
  }
}

export const waliAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "wali"],
    queryFn: getWaliAccount,
    staleTime: 5 * 60_000,
  })

export type TutorAccount = {
  name: string
  initials: string
  role: string
  email: string
  teaching: {
    subjects: string[]
    levels: string
    availability: string
    /* Rupiah per sesi */
    rate: number
  }
  lbbContact: LbbContact
  appVersion: string
}

export async function getTutorAccount(): Promise<TutorAccount> {
  assertMockAllowed()
  await delay()

  return {
    name: "Kak Budi Santoso",
    initials: "BS",
    role: "Tutor",
    email: "budi.santoso@gmail.com",
    teaching: {
      subjects: ["Matematika", "IPA"],
      levels: "SMP–SMA",
      availability: "Senin–Sabtu, 15.00–21.00",
      rate: 60_000,
    },
    lbbContact: LBB_CONTACT,
    appVersion: APP_VERSION,
  }
}

export const tutorAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "tutor"],
    queryFn: getTutorAccount,
    staleTime: 5 * 60_000,
  })

export async function logout() {
  /* TODO(backend): panggil endpoint logout */
  await delay(300)
}
