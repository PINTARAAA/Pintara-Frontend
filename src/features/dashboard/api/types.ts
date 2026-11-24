export type TaskIcon =
  | "clipboard"
  | "alert"
  | "wallet"
  | "user-plus"
  | "users"
  | "calendar"
  | "book"

export type DashboardTask = {
  id: string
  icon: TaskIcon
  title: string
  description: string
  amount?: number
  count?: number
  to: string
}

export type Person = {
  name: string
  initials: string
}
