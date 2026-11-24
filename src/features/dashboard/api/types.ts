/* Tipe bersama untuk data beranda semua peran */

/* Ikon dipilih oleh UI berdasarkan kunci ini; data API tidak membawa komponen */
export type TaskIcon =
  | "clipboard"
  | "alert"
  | "wallet"
  | "user-plus"
  | "users"
  | "calendar"
  | "book"

/* Satu baris "Perlu tindakan" */
export type DashboardTask = {
  id: string
  icon: TaskIcon
  title: string
  description: string
  /* Nominal Rupiah di sisi kanan, mis. 600000 → "Rp600.000" */
  amount?: number
  /* Jumlah item di sisi kanan, mis. 3 pendaftaran menunggu */
  count?: number
  /* Halaman tujuan saat baris diketuk */
  to: string
}

export type Person = {
  name: string
  initials: string
}
