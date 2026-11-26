import type { AccountStatus } from "@/types/data-master"

export type AccountRole = "wali" | "tutor" | "pengelola"

export type Account = {
  id: string
  role: AccountRole
  name: string
  email: string
  username: string
  phone: string
  createdAt: Date
  lastLoginAt: Date | null
  status: AccountStatus
  /* Wali saja: id siswa yang tertaut */
  studentIds: string[]
}

export type AccountRow = Pick<
  Account,
  "id" | "role" | "name" | "email" | "status"
> & { students: number }

export type AccountList = {
  counts: Record<AccountRole, number>
  items: AccountRow[]
}

export type LinkedStudent = {
  id: string
  name: string
  grade: string
  status: AccountStatus
}

export type AccountDetail = Account & { students: LinkedStudent[] }

export type AccountInput = {
  role: AccountRole
  name: string
  email: string
  username: string
  phone: string
  studentIds: string[]
}
