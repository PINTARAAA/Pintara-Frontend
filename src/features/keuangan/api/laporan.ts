import { queryOptions } from "@tanstack/react-query"
import { addMonths, format, startOfMonth, subMonths } from "date-fns"

import { getHonorRecap, monthKey } from "@/features/keuangan/api/honor"
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
  StudentBillRow,
} from "@/types/keuangan"

/*
 * Laporan Keuangan · Figma PINTARA → UI Screen → Pengelola LBB →
 * P8 · Laporan Keuangan
 *
 * TODO(backend):
 *   getFinanceSummary(bulan)          → httpClient.get("/pengelola/laporan-keuangan", { params: { bulan } })
 *   getStudentBills(bulan)            → httpClient.get("/pengelola/tagihan", { params: { bulan } })
 *   getStudentBill(id)                → httpClient.get(`/pengelola/tagihan/${id}`)
 *   recordManualPayment(id, form)     → httpClient.post(`/pengelola/tagihan/${id}/pembayaran`, form)
 *   generateReport(input)             → httpClient.post("/pengelola/laporan-keuangan/unduh", input)
 *                                       (mengembalikan URL file)
 *
 * Bagian lembaga = total tagihan siswa − total honor tutor pada periode itu.
 * Honor diambil dari rekap P7 bila sudah dihitung; bila belum, dipakai
 * estimasi dari presensi berjalan (data contoh).
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

const billsOf = (month: Date) =>
  bills.filter((b) => monthKey(b.period) === monthKey(month))

/* ---------- Ringkasan (layar Laporan Keuangan) ---------- */

/* Estimasi honor bila rekap P7 bulan itu belum dihitung (data contoh) */
const HONOR_ESTIMATE = {
  total: 10_680_000,
  sessions: 178,
  tutors: 12,
  paid: { amount: 3_420_000, tutors: 4 },
}

export async function getFinanceSummary(month?: Date): Promise<FinanceSummary> {
  assertMockAllowed()
  await delay()
  const months = availableMonths()
  const active = startOfMonth(month ?? new Date())
  const list = billsOf(active)
  if (list.length === 0) return { state: "kosong", months, month: active }

  const statuses = list.map(billStatus)
  const allPayments = list.flatMap((b) => b.payments)
  const successful = allPayments.filter((p) => p.status === "berhasil")
  const billsTotal = list.reduce((sum, b) => sum + billTotal(b), 0)

  const recap = await getHonorRecap(active)
  const honor =
    recap.state === "dihitung"
      ? {
          total: recap.total,
          sessions: recap.sessions,
          tutors: recap.paidHonors.length + recap.unpaidHonors.length,
          calculated: true,
        }
      : { ...HONOR_ESTIMATE, calculated: false }
  const honorPaid =
    recap.state === "dihitung"
      ? recap.paid
      : HONOR_ESTIMATE.paid

  return {
    state: "ada",
    months,
    month: active,
    bills: {
      total: billsTotal,
      count: list.length,
      lunas: statuses.filter((s) => s === "lunas").length,
      sebagian: statuses.filter((s) => s === "sebagian").length,
      belum: statuses.filter((s) => s === "belum_bayar").length,
    },
    payments: {
      received: successful.reduce((sum, p) => sum + p.amount, 0),
      transactions: successful.length,
      failed: allPayments.filter((p) => p.status !== "berhasil").length,
    },
    honor: {
      total: honor.total,
      sessions: honor.sessions,
      tutors: honor.tutors,
      calculated: honor.calculated,
    },
    honorPaid,
    institutionShare: billsTotal - honor.total,
  }
}

export const financeSummaryQuery = (month?: Date) =>
  queryOptions({
    queryKey: ["laporan-keuangan", "ringkasan", month ? monthKey(month) : "now"],
    queryFn: () => getFinanceSummary(month),
  })

/* ---------- Daftar tagihan siswa ---------- */

export async function getStudentBills(month?: Date): Promise<StudentBillList> {
  assertMockAllowed()
  await delay()
  const active = startOfMonth(month ?? new Date())
  const rows: StudentBillRow[] = billsOf(active).map((b) => ({
    id: b.id,
    studentName: b.studentName,
    sessions: billSessions(b),
    dueDate: b.dueDate,
    total: billTotal(b),
    remaining: billRemaining(b),
    status: billStatus(b),
  }))
  const byRemaining = (a: StudentBillRow, b: StudentBillRow) =>
    b.remaining - a.remaining
  const total = rows.reduce((sum, r) => sum + r.total, 0)
  const remaining = rows.reduce((sum, r) => sum + r.remaining, 0)
  return {
    months: availableMonths(),
    month: active,
    total,
    paid: total - remaining,
    remaining,
    unpaid: rows.filter((r) => r.status === "belum_bayar").sort(byRemaining),
    partial: rows.filter((r) => r.status === "sebagian").sort(byRemaining),
    paidOff: rows
      .filter((r) => r.status === "lunas")
      .sort((a, b) => a.studentName.localeCompare(b.studentName)),
  }
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

function findBill(id: string) {
  const bill = bills.find((b) => b.id === id)
  if (!bill) throw new ReportNotFoundError()
  return bill
}

export async function getStudentBill(id: string): Promise<StudentBill> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(findBill(id))
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

export async function generateReport(
  input: ReportInput,
  options: { simulateFailure?: boolean } = {}
): Promise<ReportFile> {
  assertMockAllowed()
  await delay(1200)
  if (!navigator.onLine || options.simulateFailure) {
    throw new Error("Laporan gagal dibuat.")
  }
  const summary = await getFinanceSummary(input.month)
  /* SEMENTARA: berkas teks pengganti sampai backend menyusun PDF/Excel */
  const lines =
    summary.state === "ada"
      ? [
          `Laporan Keuangan · ${format(input.month, "MM/yyyy")}`,
          `Jenis: ${REPORT_TYPES[input.type]}`,
          `Total tagihan siswa: ${summary.bills.total}`,
          `Total honor tutor: ${summary.honor.total}`,
          `Bagian lembaga: ${summary.institutionShare}`,
        ]
      : [`Laporan Keuangan · ${format(input.month, "MM/yyyy")}`, "Belum ada data."]
  const blob = new Blob([lines.join("\n")], { type: "text/plain" })
  const label = format(input.month, "MMMyyyy").replace(/^./, (c) => c.toUpperCase())
  return {
    name: `Laporan_Keuangan_${label}.${input.format}`,
    size: input.type === "lengkap" ? 1_260_000 : 420_000,
    url: URL.createObjectURL(blob),
  }
}
