import { addDays, setHours, setMinutes, startOfDay } from "date-fns"

/*
 * Utilitas data contoh selama backend belum tersedia.
 * Hapus file ini setelah semua fungsi get…() memanggil API.
 */

/* Jeda singkat agar state loading ikut teruji */
export const delay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/* Tanggal relatif terhadap hari ini, mis. at(1, 16) = besok pukul 16.00 */
export function at(daysFromToday: number, hour: number, minute = 0) {
  return setMinutes(
    setHours(addDays(startOfDay(new Date()), daysFromToday), hour),
    minute
  )
}

/* Lempar error di build produksi agar data contoh tidak pernah tampil ke pengguna */
export function assertMockAllowed() {
  if (!import.meta.env.DEV) {
    throw new Error("Data contoh belum terhubung ke server.")
  }
}
