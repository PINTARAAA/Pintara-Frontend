import type { StatusOf } from "@/lib/constants/status"

export type AccountStatus = StatusOf<"akun">
export type Level = "SD" | "SMP" | "SMA"

export type PickupMethod = "Tunai di LBB" | "Transfer bank"

export type Tutor = {
  id: string
  name: string
  phone: string
  email: string
  education: string
  subjects: string[]
  levels: Level[]
  days: string[]
  from: string
  until: string
  address: string
  district: string
  rate: number | null
  pickup: PickupMethod
  joinedAt: Date
  activeStudents: number
  activeSchedules: number
  status: AccountStatus
}

export type MasterFilter = {
  query?: string
  subject?: string
  district?: string
  status?: AccountStatus
}

export type TutorRow = Pick<
  Tutor,
  "id" | "name" | "subjects" | "levels" | "district" | "rate" | "status"
>

export type TutorInput = Pick<
  Tutor,
  | "name"
  | "phone"
  | "email"
  | "education"
  | "subjects"
  | "levels"
  | "days"
  | "from"
  | "until"
  | "address"
> & { rate: number }

export type Lesson = {
  subject: string
  day: string
  from: string
  until: string
  tutorName: string
}

export type Student = {
  id: string
  name: string
  grade: string
  school: string
  address: string
  district: string
  subjects: string[]
  needs: string
  guardian: {
    name: string
    phone: string
    accountActive: boolean
    linkedStudents: number
  }
  lessons: Lesson[]
  status: AccountStatus
  endedAt?: Date
}

export type StudentRow = Pick<
  Student,
  "id" | "name" | "grade" | "subjects" | "status" | "endedAt"
> & { tutorNames: string[] }
