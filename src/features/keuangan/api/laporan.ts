import { queryOptions } from "@tanstack/react-query"
import { addMonths, startOfMonth, subMonths } from "date-fns"

import { monthKey } from "@/features/keuangan/api/honor"
import { httpClient, isApiError } from "@/lib/api"
import { bills } from "@/lib/data/keuangan"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type { BillStatus } from "@/types/tagihan"
import type {
  FinanceSummary,
  ManualPaymentInput,
  ReportFile,
  ReportInput,
  ReportType,
  StudentBill,
  StudentBillList,
} from "@/types/keuangan"

/*
 * Laporan Keuangan · Figma PINTARA → UI Screen → Pengelola LBB →
 * P8 · Laporan Keuangan
 *
 * Sudah memakai BE:
 *   getFinanceSummary(bulan)          → GET /pengelola/laporan-keuangan
 *   generateReport(input)             → POST /pengelola/laporan-keuangan/unduh
 *   getStudentBills(bulan)            → GET /pengelola/tagihan
 *   getStudentBill(id)                → GET /pengelola/tagihan/:id
 *
 * TODO(backend):
 *   recordManualPayment(id, form)     → httpClient.post(`/pengelola/tagihan/${id}/pembayaran`, form)
 *
 * Bagian lembaga = total tagihan siswa − total honor tutor pada periode itu.
 * Tambahkan ?unduh=gagal pada layar laporan untuk menguji "Gagal dibuat".
 */

export const MANUAL_METHODS = ["Tunai di LBB", "Transfer bank"] as const

/* ---------- Turunan ---------- */

export const billTotal = (bill: Pick<StudentBill, "items">) =>
  bill.items.reduce((sum, i) => sum + i.sessions * i.unitPrice, 0)

export const billPaid = (bill: Pick<StudentBill, "payments">) =>
  bill.payments
    .filter((p) => p.status === "berhasil")
    .reduce((sum, p) => sum + p.amount, 0)

export const billRemaining = (bill: Pick<StudentBill, "items" | "payments">) =>
  Math.max(billTotal(bill) - billPaid(bill), 0)

export const billSessions = (bill: Pick<StudentBill, "items">) =>
  bill.items.reduce((sum, i) => sum + i.sessions, 0)

export function billStatus(
  bill: Pick<StudentBill, "items" | "payments">
): BillStatus {
  const paid = billPaid(bill)
  if (paid >= billTotal(bill)) return "lunas"
  return paid > 0 ? "sebagian" : "belum_bayar"
}

/* Periode yang bisa dipilih: bulan depan (masih kosong), bulan ini, bulan lalu */
export function availableMonths() {
  const current = startOfMonth(new Date())
  return [addMonths(current, 1), current, subMonths(current, 1)]
}

/* ---------- Ringkasan (layar Laporan Keuangan) ---------- */

/*
 * Ringkasan bulan tsb: tagihan & pembayaran siswa, honor tutor (dari rekap
 * P7 bila sudah dihitung; bila belum, estimasi BE dari presensi final),
 * bagian lembaga. state "kosong" bila belum ada tagihan.
 */
export async function getFinanceSummary(month?: Date): Promise<FinanceSummary> {
  const { data } = await httpClient.get<FinanceSummary>(
    "/pengelola/laporan-keuangan",
    { params: month ? { bulan: monthKey(month) } : undefined }
  )
  return data
}

export const financeSummaryQuery = (month?: Date) =>
  queryOptions({
    queryKey: ["laporan-keuangan", "ringkasan", month ? monthKey(month) : "now"],
    queryFn: () => getFinanceSummary(month),
  })

/* ---------- Daftar tagihan siswa ---------- */

/*
 * Tagihan siswa bulan tsb dikelompokkan: belum bayar & sebagian (sisa
 * terbesar dulu), lunas (urut nama).
 */
export async function getStudentBills(month?: Date): Promise<StudentBillList> {
  const { data } = await httpClient.get<StudentBillList>("/pengelola/tagihan", {
    params: month ? { bulan: monthKey(month) } : undefined,
  })
  return data
}

export const studentBillsQuery = (month?: Date) =>
  queryOptions({
    queryKey: ["laporan-keuangan", "tagihan", month ? monthKey(month) : "now"],
    queryFn: () => getStudentBills(month),
  })

/* ---------- Rincian satu tagihan ---------- */

export class ReportNotFoundError extends Error {
  constructor() {
    super("Tagihan tidak ditemukan.")
    this.name = "ReportNotFoundError"
  }
}

/* 404 dari BE, atau dari mock pembayaran manual */
export const isReportNotFoundError = (error: unknown) =>
  (isApiError(error) && error.code === "not_found") ||
  error instanceof ReportNotFoundError

function findBill(id: string) {
  const bill = bills.find((b) => b.id === id)
  if (!bill) throw new ReportNotFoundError()
  return bill
}

/* Rincian tagihan + semua transaksi (gateway & manual) */
export async function getStudentBill(id: string): Promise<StudentBill> {
  const { data } = await httpClient.get<StudentBill>(
    `/pengelola/tagihan/${encodeURIComponent(id)}`
  )
  return data
}

export const studentBillQuery = (id: string) =>
  queryOptions({
    queryKey: ["laporan-keuangan", "tagihan-detail", id],
    queryFn: () => getStudentBill(id),
  })

/* Catat pembayaran yang diterima di luar payment gateway */
export async function recordManualPayment(
  id: string,
  input: ManualPaymentInput
): Promise<StudentBill> {
  assertMockAllowed()
  await delay(800)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const bill = findBill(id)
  if (input.amount <= 0 || input.amount > billRemaining(bill)) {
    throw new Error("Nominal pembayaran tidak valid.")
  }
  bill.payments.push({
    id: `TRX-MANUAL-${Date.now()}`,
    amount: input.amount,
    method: input.method,
    status: "berhasil",
    createdAt: input.paidAt,
    manual: { proof: input.proof },
  })
  return structuredClone(bill)
}

/* ---------- Unduh laporan ---------- */

export const REPORT_TYPES: Record<ReportType, string> = {
  ringkasan: "Ringkasan keuangan",
  tagihan: "Tagihan & pembayaran siswa",
  honor: "Honor & pembayaran tutor",
  lengkap: "Lengkap (semua rincian)",
}

/*
 * BE menyusun file PDF/Excel, menyimpannya, lalu mengembalikan nama, ukuran,
 * dan URL relatif (/uploads/…) yang dijadikan absolut ke host BE.
 * simulateFailure (hanya development, ?unduh=gagal) tidak memanggil BE.
 */
export async function generateReport(
  input: ReportInput,
  options: { simulateFailure?: boolean } = {}
): Promise<ReportFile> {
  if (import.meta.env.DEV && options.simulateFailure) {
    throw new Error("Laporan gagal dibuat.")
  }
  const { data } = await httpClient.post<ReportFile>(
    "/pengelola/laporan-keuangan/unduh",
    { month: monthKey(input.month), type: input.type, format: input.format },
    /* Menyusun laporan lengkap bisa lebih lama dari batas umum 15 detik */
    { timeout: 60_000 }
  )
  return { ...data, url: new URL(data.url, httpClient.defaults.baseURL).href }
}
