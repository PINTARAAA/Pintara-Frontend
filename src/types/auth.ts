export type Role = "wali" | "tutor" | "pengelola"

export type AuthUser = {
  name: string
  role: Role
}

export type LoginNotice = "sesi-berakhir" | "keluar"

export type LoginErrorCode = "invalid_credentials" | "account_inactive"
