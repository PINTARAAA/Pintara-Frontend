/* Peran pengguna PINTARA */
export type Role = "wali" | "tutor" | "pengelola"

export type AuthUser = {
  name: string
  role: Role
}

/* Alasan pengguna diarahkan ke halaman masuk (?alasan=… pada URL) */
export type LoginNotice = "sesi-berakhir" | "keluar"
