import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/data/auth"
import type { AuthUser, LoginErrorCode } from "@/types/auth"

import type { LoginInput } from "@/features/auth/schemas"

/*
 * Masuk ke akun.
 *
 * TODO(backend): ganti isi `login()` dengan panggilan API, mis.
 *   const { data } = await httpClient.post("/auth/login", input)
 * dan petakan respons gagal ke `LoginError` dengan kode yang sama agar
 * tampilan form tidak perlu diubah.
 *
 * Selama backend belum ada, mode development memakai akun demo di bawah
 * (password semuanya "pintara123"). Akun demo tidak aktif di build produksi.
 */

export class LoginError extends Error {
  code: LoginErrorCode

  constructor(code: LoginErrorCode) {
    super(code)
    this.name = "LoginError"
    this.code = code
  }
}

export async function login(input: LoginInput): Promise<AuthUser> {
  if (!import.meta.env.DEV) {
    throw new Error("Layanan masuk belum terhubung ke server.")
  }

  await new Promise((resolve) => setTimeout(resolve, 400))

  const key = input.identifier.trim().toLowerCase().split("@")[0]
  const account = DEMO_ACCOUNTS[key]

  if (!account || input.password !== DEMO_PASSWORD) {
    throw new LoginError("invalid_credentials")
  }
  if (!account.active) {
    throw new LoginError("account_inactive")
  }
  return { name: account.name, role: account.role }
}
