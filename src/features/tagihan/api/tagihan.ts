import { queryOptions } from "@tanstack/react-query"
import { differenceInCalendarDays, startOfDay } from "date-fns"

import { addNotification } from "@/features/notifikasi/api"
import { httpClient, isApiError } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { bills, payments } from "@/lib/data/tagihan"
import { formatRupiah } from "@/lib/format"
import type {
  Bill,
  BillsOverview,
  BillStatus,
  Payment,
  PaymentResult,
} from "@/types/tagihan"

/*
 * Tagihan & Pembayaran · Figma PINTARA → UI Screen → Wali Murid → W6
 *
 * Sudah memakai BE:
 *   getBills()               → GET /wali/tagihan
 *   getBill(id)              → GET /wali/tagihan/:id
 *
 * TODO(backend):
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

/* ---------- Daftar ---------- */

/* Tagihan belum lunas semua anak, urut jatuh tempo terdekat (dari BE) */
export async function getBills(): Promise<BillsOverview> {
  const { data } = await httpClient.get<BillsOverview>("/wali/tagihan")
  return data
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

/*
 * 404 dari BE (tagihan tidak ada / milik wali lain), atau dari mock
 * pembayaran.
 */
export const isNotFoundError = (error: unknown) =>
  (isApiError(error) && error.code === "not_found") ||
  error instanceof NotFoundError

function findBill(id: string) {
  const bill = bills.find((b) => b.id === id)
  if (!bill) throw new NotFoundError()
  return bill
}

export async function getBill(id: string): Promise<Bill> {
  const { data } = await httpClient.get<Bill>(
    `/wali/tagihan/${encodeURIComponent(id)}`
  )
  return data
}

export const billQuery = (id: string) =>
  queryOptions({ queryKey: ["tagihan", "detail", id], queryFn: () => getBill(id) })

/* ---------- Pembayaran (payment gateway disimulasikan) ---------- */

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
  if (payment.status === "berhasil") {
    bill.paid += amount
    addNotification({
      kind: "pembayaran",
      title: "Pembayaran berhasil",
      body: `Tagihan ${bill.period.toLocaleDateString("id-ID", { month: "long" })} ${formatRupiah(amount)}`,
      to: "/wali/tagihan?tab=riwayat",
    })
  }

  return { payment, bill: { ...bill } }
}
