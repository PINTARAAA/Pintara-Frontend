import {
  BookOpenIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  TriangleAlertIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import type { TaskIcon } from "@/types/dashboard"

/* Ikon tiap jenis tugas "Perlu tindakan" */
export const TASK_ICONS: Record<TaskIcon, LucideIcon> = {
  clipboard: ClipboardCheckIcon,
  alert: TriangleAlertIcon,
  wallet: WalletIcon,
  "user-plus": UserPlusIcon,
  users: UsersIcon,
  calendar: CalendarIcon,
  book: BookOpenIcon,
}
