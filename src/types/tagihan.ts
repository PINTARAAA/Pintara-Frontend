import type { StatusOf } from "@/lib/constants"

export type BillStatus = StatusOf<"pembayaran">

export type BillItem = { subject: string; sessions: number; unitPrice: number }

export type Bill = {
  id: string
  number: string
  studentName: string
  period: Date
  dueDate: Date
  items: BillItem[]
  total: number
  paid: number
}

export type PaymentMethod = "QRIS" | "Virtual Account BCA" | "GoPay"
export type PaymentStatus = "berhasil" | "kedaluwarsa" | "gagal"

export type Payment = {
  id: string
  billId: string
  billPeriod: Date
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  createdAt: Date
}

export type BillsOverview = {
  priority: Bill | null
  others: Bill[]
  unreadNotifications: number
}

export type PaymentResult = {
  payment: Payment
  bill: Bill
}
