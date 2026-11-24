import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"

/*
 * Akun Wali Murid · Figma PINTARA → UI Screen → Wali Murid → W8
 *
 * TODO(backend):
 *   getWaliAccount() → httpClient.get("/wali/akun")
 *   logout()         → httpClient.post("/auth/logout") lalu hapus sesi lokal
 *
 * Data akun hanya bisa diubah oleh Pengelola LBB, jadi layar ini hanya baca.
 */
export type WaliAccount = {
  name: string
  initials: string
  role: string
  email: string
  whatsapp: string
  username: string
  students: { id: string; name: string; grade: string; subjects: string[] }[]
  lbbContact: { name: string; whatsapp: string; display: string }
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
    lbbContact: {
      name: "Kak Ila",
      whatsapp: "6281200001122",
      display: "0812-0000-1122",
    },
    appVersion: "1.0.0",
  }
}

export const waliAccountQuery = () =>
  queryOptions({
    queryKey: ["akun", "wali"],
    queryFn: getWaliAccount,
    staleTime: 5 * 60_000,
  })

export async function logout() {
  /* TODO(backend): panggil endpoint logout */
  await delay(300)
}
