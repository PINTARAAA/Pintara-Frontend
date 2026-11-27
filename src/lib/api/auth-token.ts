/*
 * Penyimpanan token akses untuk header Authorization.
 *
 * Disimpan di localStorage agar tetap login setelah halaman dimuat ulang.
 * TODO(backend): bila backend memakai cookie httpOnly, hapus file ini dan
 * aktifkan `withCredentials: true` di httpClient.
 */

const STORAGE_KEY = "pintara-token"

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    /* localStorage tidak tersedia (mode privat ketat) */
    return null
  }
}

export function setAccessToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* abaikan: sesi hanya berlaku sampai halaman ditutup */
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* abaikan */
  }
}
