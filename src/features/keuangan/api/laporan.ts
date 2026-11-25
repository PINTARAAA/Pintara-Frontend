import { queryOptions } from "@tanstack/react-query"
import { addMonths, format, setDate, startOfMonth, subMonths } from "date-fns"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"
import { getHonorRecap, monthKey } from "@/features/keuangan/api/honor"
import type { StatusOf } from "@/lib/constants/status"

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
export type BillStatus = StatusOf<"pembayaran">

export type BillItem = { subject: string; sessions: number; unitPrice: number }

export type BillPaymentMethod =
  | "QRIS"
  | "VA BCA"
  | "GoPay"
  | "Tunai di LBB"
  | "Transfer bank"

export type BillPayment = {
  id: string
  amount: number
  method: BillPaymentMethod
  status: "berhasil" | "kedaluwarsa" | "gagal"
  createdAt: Date
  /* Dicatat manual oleh pengelola (bukan lewat payment gateway) */
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

export const MANUAL_METHODS = ["Tunai di LBB", "Transfer bank"] as const
export type ManualMethod = (typeof MANUAL_METHODS)[number]

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

/* ---------- Data contoh ---------- */

const FIRST = [
  "Aisyah", "Bayu", "Salma", "Rizky", "Nabila", "Fajar", "Citra", "Dimas",
  "Kirana", "Raka", "Alya", "Farel", "Zahra", "Galih", "Intan", "Yusuf",
  "Nadia", "Hafiz", "Keisha", "Arka", "Tiara", "Rafi", "Amira", "Bima",
]
const LAST = [
  "Putri", "Saputra", "Azzahra", "Ananda", "Pratama", "Maharani", "Wijaya",
  "Lestari", "Nugroho", "Rahmawati", "Hidayat", "Permata",
]
const GUARDIANS = [
  "Sari Wulandari", "Hendra Saputra", "Rina Marlina", "Agus Setiawan",
  "Dewi Anggraini", "Bambang Irawan", "Yuni Kartika", "Teguh Prasetyo",
]
const TEMPLATES: BillItem[][] = [
  [
    { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
    { subject: "IPA", sessions: 4, unitPrice: 52_500 },
  ],
  [{ subject: "Matematika", sessions: 8, unitPrice: 60_000 }],
  [
    { subject: "Bahasa Inggris", sessions: 4, unitPrice: 50_000 },
    { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
  ],
  [{ subject: "Fisika", sessions: 8, unitPrice: 67_500 }],
  [
    { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
    { subject: "Fisika", sessions: 4, unitPrice: 67_500 },
  ],
  [{ subject: "Bahasa Inggris", sessions: 8, unitPrice: 50_000 }],
]
const GATEWAY: BillPaymentMethod[] = ["QRIS", "VA BCA", "GoPay"]

const bills: StudentBill[] = []

function buildMonth(period: Date, opts: { unpaid: number; partial: number }) {
  const ym = format(period, "yyyy-MM")
  const due = setDate(period, 10)
  const created: StudentBill[] = []
  let seq = 1
  const add = (
    studentName: string,
    items: BillItem[],
    payments: Omit<BillPayment, "id">[],
    guardianName = GUARDIANS[seq % GUARDIANS.length]
  ) => {
    const number = `INV-${ym}-${String(seq).padStart(4, "0")}`
    created.push({
      id: `${ym}-${seq}`,
      number,
      studentName,
      guardianName,
      period,
      dueDate: due,
      items,
      payments: payments.map((p, i) => ({ ...p, id: `TRX-${ym}-${seq}-${i}` })),
    })
    seq++
  }
  const on = (day: number, hour = 19) =>
    new Date(period.getFullYear(), period.getMonth(), day, hour, 10)

  /* Baris yang sama dengan contoh di Figma */
  add("Bayu Saputra", [{ subject: "Matematika", sessions: 8, unitPrice: 50_000 }], [], "Hendra Saputra")
  add("Salma Azzahra", [{ subject: "Matematika", sessions: 4, unitPrice: 60_000 }], [], "Rina Marlina")
  add("Aisyah Putri", TEMPLATES[0], [
    { amount: 300_000, method: "VA BCA", status: "kedaluwarsa", createdAt: on(11, 8) },
    { amount: 300_000, method: "QRIS", status: "berhasil", createdAt: on(12) },
  ], "Sari Wulandari")
  add("Rizky Ananda", [{ subject: "Fisika", sessions: 8, unitPrice: 67_500 }], [
    { amount: 340_000, method: "GoPay", status: "berhasil", createdAt: on(9) },
  ], "Agus Setiawan")

  const fixedUnpaid = 2
  const fixedPartial = 2
  const total = 84
  for (let i = created.length; i < total; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`
    const items = TEMPLATES[i % TEMPLATES.length]
    const amount = billTotal({ items })
    const method = GATEWAY[i % GATEWAY.length]
    const unpaidLeft = opts.unpaid - fixedUnpaid
    const partialLeft = opts.partial - fixedPartial
    const idx = i - 4
    if (idx < unpaidLeft) {
      add(name, items, i % 3 === 0
        ? [{ amount, method, status: "gagal", createdAt: on(8) }]
        : [])
    } else if (idx < unpaidLeft + partialLeft) {
      add(name, items, [
        { amount: Math.round(amount / 2 / 10_000) * 10_000, method, status: "berhasil", createdAt: on(6) },
      ])
    } else {
      /* Sebagian dibayar dua kali (cicil) */
      add(name, items, i % 4 === 0
        ? [
            { amount: amount / 2, method, status: "berhasil", createdAt: on(3) },
            { amount: amount / 2, method: "QRIS", status: "berhasil", createdAt: on(9) },
          ]
        : [{ amount, method, status: "berhasil", createdAt: on(1 + (i % 9)) }])
    }
  }
  bills.push(...created)
}

;(() => {
  const current = startOfMonth(new Date())
  buildMonth(current, { unpaid: 8, partial: 6 })
  buildMonth(subMonths(current, 1), { unpaid: 2, partial: 2 })
})()

/* Periode yang bisa dipilih: bulan depan (masih kosong), bulan ini, bulan lalu */
export function availableMonths() {
  const current = startOfMonth(new Date())
  return [addMonths(current, 1), current, subMonths(current, 1)]
}

const billsOf = (month: Date) =>
  bills.filter((b) => monthKey(b.period) === monthKey(month))

/* ---------- Ringkasan (layar Laporan Keuangan) ---------- */

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
        /* false = rekap P7 belum dihitung, angka masih estimasi */
        calculated: boolean
      }
      honorPaid: { amount: number; tutors: number }
      institutionShare: number
    }

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

export type ManualPaymentInput = {
  amount: number
  paidAt: Date
  method: ManualMethod
  proof?: { name: string; size: number }
}

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

export const REPORT_TYPES = {
  ringkasan: "Ringkasan keuangan",
  tagihan: "Tagihan & pembayaran siswa",
  honor: "Honor & pembayaran tutor",
  lengkap: "Lengkap (semua rincian)",
} as const
export type ReportType = keyof typeof REPORT_TYPES
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
