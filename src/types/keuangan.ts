import type { BillItem, BillStatus } from "@/types/tagihan"
import type { TutorSession } from "@/types/presensi"

export type HonorPaymentMethod = "tunai" | "transfer"

export type HonorPayment = {
  amount: number
  method: HonorPaymentMethod
  paidAt: Date
  proof: { name: string; size: number }
  recordedAt: Date
}

export type HonorLine = {
  subject: string
  sessions: number
  rate: number
  amount: number
}

export type TutorHonor = {
  tutorId: string
  name: string
  shortName: string
  lines: HonorLine[]
  sessions: number
  total: number
  method: HonorPaymentMethod
  methodNote?: string
  payment?: HonorPayment
}

export type TutorProfile = {
  id: string
  name: string
  shortName: string
  rate: number | null
  method: HonorPaymentMethod
  methodNote?: string
}

export type Recap = {
  month: Date
  calculatedAt: Date
  honors: TutorHonor[]
  skipped: string[]
  sessionsByTutor: Record<string, TutorSession[]>
}

export type HonorRecap =
  | {
      state: "belum_dihitung"
      months: Date[]
      month: Date
      final: number
      total: number
      tutorsWithoutRate: string[]
    }
  | {
      state: "dihitung"
      months: Date[]
      month: Date
      calculatedAt: Date
      total: number
      sessions: number
      paid: { amount: number; tutors: number }
      unpaid: { amount: number; tutors: number }
      unpaidHonors: TutorHonor[]
      paidHonors: TutorHonor[]
      skipped: string[]
    }

export type HonorDetail = TutorHonor & {
  month: Date
  status: "lunas" | "sebagian" | "belum_bayar"
  sessionList?: TutorSession[]
}

export type HonorPaymentInput = {
  method: HonorPaymentMethod
  paidAt: Date
  amount: number
  proof: { name: string; size: number }
}

export type BillPaymentMethod =
  "QRIS" | "VA BCA" | "GoPay" | "Tunai di LBB" | "Transfer bank"

export type BillPayment = {
  id: string
  amount: number
  method: BillPaymentMethod
  status: "berhasil" | "kedaluwarsa" | "gagal"
  createdAt: Date
  manual?: { proof?: { name: string; size: number } }
}

export type StudentBill = {
  id: string
  number: string
  studentName: string
  guardianName: string
  period: Date
  dueDate: Date
  items: BillItem[]
  payments: BillPayment[]
}

export type ManualMethod = "Tunai di LBB" | "Transfer bank"

export type FinanceSummary =
  | { state: "kosong"; months: Date[]; month: Date }
  | {
      state: "ada"
      months: Date[]
      month: Date
      bills: {
        total: number
        count: number
        lunas: number
        sebagian: number
        belum: number
      }
      payments: { received: number; transactions: number; failed: number }
      honor: {
        total: number
        sessions: number
        tutors: number
        calculated: boolean
      }
      honorPaid: { amount: number; tutors: number }
      institutionShare: number
    }

export type StudentBillRow = {
  id: string
  studentName: string
  sessions: number
  dueDate: Date
  total: number
  remaining: number
  status: BillStatus
}

export type StudentBillList = {
  months: Date[]
  month: Date
  total: number
  paid: number
  remaining: number
  unpaid: StudentBillRow[]
  partial: StudentBillRow[]
  paidOff: StudentBillRow[]
}

export type ManualPaymentInput = {
  amount: number
  paidAt: Date
  method: ManualMethod
  proof?: { name: string; size: number }
}

export type ReportType = "ringkasan" | "tagihan" | "honor" | "lengkap"
export type ReportFormat = "pdf" | "xlsx"

export type ReportInput = {
  month: Date
  type: ReportType
  format: ReportFormat
}

export type ReportFile = {
  name: string
  size: number
  url: string
}
