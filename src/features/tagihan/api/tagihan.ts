import { queryOptions } from "@tanstack/react-query"
import { differenceInCalendarDays, startOfDay } from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import type { StatusOf } from "@/lib/constants/status"

/*
 * Tagihan & Pembayaran · Figma PINTARA → UI Screen → Wali Murid → W6
 *
 * TODO(backend):
 *   getBills()               → httpClient.get("/wali/tagihan")
 *   getBill(id)              → httpClient.get(`/wali/tagihan/${id}`)
 *   getPayments()            → httpClient.get("/wali/pembayaran")
 *   createPayment(id, nominal) → httpClient.post(`/wali/tagihan/${id}/bayar`,
 *                              { nominal }) lalu arahkan ke URL payment gateway
 *   getPaymentResult(trxId)  → httpClient.get(`/wali/pembayaran/${trxId}`)
 *                              (dipanggil saat kembali dari payment gateway)
 *
 * Selama backend belum ada (mode development) data disimpan di memori dan
 * payment gateway disimulasikan (memproses ±2 detik, lalu berhasil).
 * Tambahkan ?hasil=gagal pada halaman bayar untuk menguji "Pembayaran gagal".
 */
export type BillStatus = StatusOf<"pembayaran">

export type BillItem = { subject: string; sessions: number; unitPrice: number }

export type Bill = {
  id: string
  number: string
  studentName: string
  /* Hari pertama periode tagihan (bulan) */
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

/* ---------- Turunan ---------- */

export const remainingOf = (bill: Pick<Bill, "total" | "paid">) =>
  Math.max(bill.total - bill.paid, 0)

export function statusOf(bill: Pick<Bill, "total" | "paid">): BillStatus {
  if (bill.paid >= bill.total) return "lunas"
  return bill.paid > 0 ? "sebagian" : "belum_bayar"
}

/* Selisih hari ke jatuh tempo: negatif = sudah lewat */
export const daysUntilDue = (bill: Pick<Bill, "dueDate">, now = new Date()) =>
  differenceInCalendarDays(startOfDay(bill.dueDate), startOfDay(now))

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

const bills: Bill[] = [
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

const payments: Payment[] = [
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

/* ---------- Daftar ---------- */

export type BillsOverview = {
  /* Tagihan belum lunas yang paling mendesak (lewat jatuh tempo dulu) */
  priority: Bill | null
  others: Bill[]
  unreadNotifications: number
}

export async function getBills(): Promise<BillsOverview> {
  assertMockAllowed()
  await delay()

  const open = bills
    .filter((b) => statusOf(b) !== "lunas")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  return {
    priority: open[0] ?? null,
    others: open.slice(1),
    unreadNotifications: 2,
  }
}

export const billsQuery = () =>
  queryOptions({ queryKey: ["tagihan", "daftar"], queryFn: getBills })

export async function getPayments(): Promise<Payment[]> {
  assertMockAllowed()
  await delay()
  return [...payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

export const paymentsQuery = () =>
  queryOptions({ queryKey: ["tagihan", "pembayaran"], queryFn: getPayments })

/* ---------- Detail ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Tagihan tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

function findBill(id: string) {
  const bill = bills.find((b) => b.id === id)
  if (!bill) throw new NotFoundError()
  return bill
}

export async function getBill(id: string): Promise<Bill> {
  assertMockAllowed()
  await delay(300)
  return { ...findBill(id) }
}

export const billQuery = (id: string) =>
  queryOptions({ queryKey: ["tagihan", "detail", id], queryFn: () => getBill(id) })

/* ---------- Pembayaran (payment gateway disimulasikan) ---------- */

export type PaymentResult = {
  payment: Payment
  bill: Bill
}

let trxCounter = 8841

export async function createPayment(
  billId: string,
  amount: number,
  options: { simulateFailure?: boolean } = {}
): Promise<PaymentResult> {
  assertMockAllowed()
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")

  const bill = findBill(billId)
  if (amount <= 0 || amount > remainingOf(bill)) {
    throw new Error("Nominal pembayaran tidak valid.")
  }

  /* Waktu "memproses" di payment gateway */
  await delay(2000)

  const now = new Date()
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const payment: Payment = {
    id: `TRX-${ymd}-${trxCounter++}`,
    billId,
    billPeriod: bill.period,
    amount,
    method: amount === remainingOf(bill) ? "QRIS" : "Virtual Account BCA",
    status: options.simulateFailure ? "kedaluwarsa" : "berhasil",
    createdAt: now,
  }
  payments.push(payment)
  if (payment.status === "berhasil") bill.paid += amount

  return { payment, bill: { ...bill } }
}
