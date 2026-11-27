import { httpClient, isApiError, setAccessToken } from "@/lib/api"
import type { AuthUser, LoginErrorCode, Role } from "@/types/auth"

import type { LoginInput } from "@/features/auth/schemas"

type LoginResponse = {
  id: string
  name: string
  role: Role
  username: string
  email: string | null
  whatsapp: string | null
  token: string
}

const LOGIN_ERROR_CODES: readonly LoginErrorCode[] = [
  "invalid_credentials",
  "account_inactive",
]

const isLoginErrorCode = (code?: string): code is LoginErrorCode =>
  LOGIN_ERROR_CODES.includes(code as LoginErrorCode)

export class LoginError extends Error {
  code: LoginErrorCode

  constructor(code: LoginErrorCode, message?: string) {
    super(message ?? code)
    this.name = "LoginError"
    this.code = code
  }
}

export async function login(input: LoginInput): Promise<AuthUser> {
  try {
    const { data } = await httpClient.post<LoginResponse>("/auth/login", {
      identifier: input.identifier.trim(),
      password: input.password,
    })
    setAccessToken(data.token)
    return { name: data.name, role: data.role }
  } catch (error) {
    if (isApiError(error) && isLoginErrorCode(error.serverCode)) {
      throw new LoginError(error.serverCode, error.message)
    }
    throw error
  }
}
