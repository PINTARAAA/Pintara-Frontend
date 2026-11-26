import { at } from "@/lib/data/mock"
import type { Bill, BillItem, Payment } from "@/types/tagihan"

/* ---------- Data contoh ---------- */

const ITEMS: BillItem[] = [
  { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
  { subject: "IPA", sessions: 4, unitPrice: 52_500 },
]

const total = (items: BillItem[]) =>
  items.reduce((sum, i) => sum + i.sessions * i.unitPrice, 0)

function monthOf(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const octDue = at(-45, 0)
const novDue = at(-14, 0)
const decDue = at(16, 0)

export const bills: Bill[] = [
  {
    id: "inv-okt",
    number: `INV-${octDue.getFullYear()}-${String(octDue.getMonth() + 1).padStart(2, "0")}-0098`,
    studentName: "Aisyah Putri",
    period: monthOf(octDue),
    dueDate: octDue,
    items: ITEMS,
    total: total(ITEMS),
    paid: total(ITEMS),
  },
  {
    id: "inv-nov",
    number: `INV-${novDue.getFullYear()}-${String(novDue.getMonth() + 1).padStart(2, "0")}-0105`,
    studentName: "Aisyah Putri",
    period: monthOf(novDue),
    dueDate: novDue,
    items: ITEMS,
    total: total(ITEMS),
    paid: 300_000,
  },
  {
    id: "inv-des",
    number: `INV-${decDue.getFullYear()}-${String(decDue.getMonth() + 1).padStart(2, "0")}-0112`,
    studentName: "Aisyah Putri",
    period: monthOf(decDue),
    dueDate: decDue,
    items: ITEMS,
    total: total(ITEMS),
    paid: 0,
  },
]

export const payments: Payment[] = [
  {
    id: "TRX-OKT-0001",
    billId: "inv-okt",
    billPeriod: monthOf(octDue),
    amount: 450_000,
    method: "QRIS",
    status: "berhasil",
    createdAt: at(-47, 20, 11),
  },
  {
    id: "TRX-NOV-0001",
    billId: "inv-nov",
    billPeriod: monthOf(novDue),
    amount: 300_000,
    method: "Virtual Account BCA",
    status: "kedaluwarsa",
    createdAt: at(-13, 8, 2),
  },
  {
    id: "TRX-NOV-0002",
    billId: "inv-nov",
    billPeriod: monthOf(novDue),
    amount: 300_000,
    method: "QRIS",
    status: "berhasil",
    createdAt: at(-12, 19, 20),
  },
]
