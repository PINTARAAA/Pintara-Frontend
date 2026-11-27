import { queryOptions } from "@tanstack/react-query"

import {
  clearAccessToken,
  getAccessToken,
  httpClient,
  isApiError,
} from "@/lib/api"
import type { AuthUser, Role } from "@/types/auth"

type MeResponse = {
  id: string
  name: string
  role: Role
  username: string
  email: string | null
  whatsapp: string | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!getAccessToken()) return null

  try {
    const { data } = await httpClient.get<MeResponse>("/auth/me")
    return { name: data.name, role: data.role }
  } catch (error) {
    if (
      isApiError(error) &&
      (error.code === "unauthorized" || error.code === "forbidden")
    ) {
      clearAccessToken()
      return null
    }
    throw error
  }
}

export const sessionQuery = () =>
  queryOptions({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    staleTime: Infinity,
    retry: false,
  })
