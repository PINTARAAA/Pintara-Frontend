import { queryOptions } from "@tanstack/react-query"
import { differenceInCalendarDays, startOfDay } from "date-fns"

import { httpClient, isApiError } from "@/lib/api"
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
 *   createPayment(id, nominal) → POST /wali/tagihan/:id/bayar
 *   getPayments()            → GET /wali/pembayaran
 *   getPaymentResult(trxId)  → GET /wali/pembayaran/:trxId
 *
 * Payment gateway disimulasikan BE. Tambahkan ?hasil=gagal pada halaman
 * bayar (mode development) untuk menguji "Pembayaran gagal".
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

/* Riwayat transaksi semua tagihan wali, terbaru dulu (dari BE) */
export async function getPayments(): Promise<Payment[]> {
  const { data } = await httpClient.get<Payment[]>("/wali/pembayaran")
  return data
}

export const paymentsQuery = () =>
  queryOptions({ queryKey: ["tagihan", "pembayaran"], queryFn: getPayments })

/* ---------- Detail ---------- */

/* 404 dari BE (tagihan tidak ada / milik wali lain) */
export const isNotFoundError = (error: unknown) =>
  isApiError(error) && error.code === "not_found"

export async function getBill(id: string): Promise<Bill> {
  const { data } = await httpClient.get<Bill>(
    `/wali/tagihan/${encodeURIComponent(id)}`
  )
  return data
}

export const billQuery = (id: string) =>
  queryOptions({ queryKey: ["tagihan", "detail", id], queryFn: () => getBill(id) })

/* ---------- Pembayaran ---------- */

/*
 * Payment gateway disimulasikan BE: transaksi langsung berhasil, atau
 * kedaluwarsa bila simulateFailure. 400 bila nominal ≤ 0 atau melebihi sisa.
 */
export async function createPayment(
  billId: string,
  amount: number,
  options: { simulateFailure?: boolean } = {}
): Promise<PaymentResult> {
  const { data } = await httpClient.post<PaymentResult>(
    `/wali/tagihan/${encodeURIComponent(billId)}/bayar`,
    { nominal: amount, ...(options.simulateFailure && { simulateFailure: true }) }
  )
  return data
}

/*
 * Hasil transaksi (dipanggil saat kembali dari payment gateway / halaman
 * hasil dimuat ulang). trxId = nomor TRX-…; 404 bila bukan milik wali.
 */
export async function getPaymentResult(trxId: string): Promise<PaymentResult> {
  const { data } = await httpClient.get<PaymentResult>(
    `/wali/pembayaran/${encodeURIComponent(trxId)}`
  )
  return data
}

export const paymentResultQuery = (trxId: string) =>
  queryOptions({
    queryKey: ["tagihan", "hasil", trxId],
    queryFn: () => getPaymentResult(trxId),
  })
