import { redirect } from "react-router"

import { sessionQuery } from "@/features/auth/api"
import { getAccessToken, queryClient } from "@/lib/api"
import type { Role } from "@/types/auth"

export async function requireSession(): Promise<Role> {
  const hadToken = Boolean(getAccessToken())
  const user = await queryClient.ensureQueryData(sessionQuery())

  if (!user) {
    queryClient.removeQueries({ queryKey: sessionQuery().queryKey })
    throw redirect(hadToken ? "/masuk?alasan=sesi-berakhir" : "/masuk")
  }
  return user.role
}

export async function requireRole(role: Role) {
  const current = await requireSession()
  if (current !== role) throw redirect("/")
  return null
}

export async function redirectIfAuthenticated() {
  if (!getAccessToken()) return null

  const user = await queryClient.ensureQueryData(sessionQuery())
  if (user) throw redirect("/")

  queryClient.removeQueries({ queryKey: sessionQuery().queryKey })
  return null
}
