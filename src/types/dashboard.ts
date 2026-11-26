import type { StatusOf } from "@/lib/constants"

export type TaskIcon =
  "clipboard" | "alert" | "wallet" | "user-plus" | "users" | "calendar" | "book"

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

export type PengelolaDashboardData = {
  admin: { name: string }
  today: {
    date: Date
    sessions: number
    tutorsOnDuty: number
    attendanceSubmitted: number
    missingYesterday: number
  }
  tasks: DashboardTask[]
  billing: {
    month: string
    paidAmount: number
    totalAmount: number
    invoices: number
    dueDate: Date
    lunas: number
    sebagian: number
    belumBayar: number
  }
  unreadNotifications: number
}

export type TutorDashboardData = {
  tutor: { name: string }
  nextSession: {
    id: string
    subject: string
    start: Date
    end: Date
    student: Person & { grade: string }
    address: string
  } | null
  tasks: DashboardTask[]
  upcoming: {
    id: string
    subject: string
    studentName: string
    start: Date
    end: Date
  }[]
  recap: {
    month: string
    held: number
    validated: number
    waitingParent: number
    disputed: number
  }
}

export type WaliStudent = Person & { id: string; grade: string }

export type WaliDashboardData = {
  parent: { name: string }
  students: WaliStudent[]
  activeStudentId: string
  nextSession: {
    id: string
    subject: string
    start: Date
    end: Date
    tutor: Person & { specialty: string }
  } | null
  tasks: DashboardTask[]
  weekSchedule: {
    id: string
    subject: string
    start: Date
    end: Date
    tutorName: string
  }[]
  history: {
    id: string
    subject: string
    date: Date
    topic: string
    status: StatusOf<"presensi">
  }[]
  unreadNotifications: number
}
