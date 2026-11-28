import { queryOptions } from "@tanstack/react-query"
import { format, startOfMonth } from "date-fns"

import { httpClient } from "@/lib/api"
import { recaps } from "@/lib/data/keuangan"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  HonorDetail,
  HonorPaymentInput,
  HonorRecap,
  HonorPaymentMethod,
  TutorHonor,
} from "@/types/keuangan"

/*
 * Rekap & Pembayaran Honor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P7 · Rekap & Pembayaran Honor
 *
 * Sudah memakai BE:
 *   getHonorRecap(bulan)              → GET /pengelola/honor
 *   calculateHonor(bulan)             → POST /pengelola/honor/hitung
 *
 * TODO(backend):
 *   getHonorDetail(bulan, tutorId)    → httpClient.get(`/pengelola/honor/${bulan}/${tutorId}`)
 *   recordHonorPayment(bulan, id, …)  → httpClient.post(`/pengelola/honor/${bulan}/${id}/bayar`, form)
 *
 * Honor = Σ (presensi terverifikasi final × tarif per sesi). Presensi final
 * diambil dari P6; tutor tanpa tarif ditandai dan tidak ikut dihitung.
 * PINTARA hanya mencatat pembayaran — dana dibayar di luar aplikasi.
 */

export const METHOD_LABEL: Record<HonorPaymentMethod, string> = {
  tunai: "Tunai di LBB",
  transfer: "Transfer",
}

const monthKey = (d: Date) => format(startOfMonth(d), "yyyy-MM")

/* ---------- Rekap per bulan (tab Honor Tutor) ---------- */

/*
 * Rekap honor bulan tsb (default bulan berjalan). belum_dihitung: progres
 * presensi final + tutor tanpa tarif; dihitung: honor per tutor (belum
 * lunas urut terbesar, lunas urut tanggal bayar terbaru).
 */
export async function getHonorRecap(month?: Date): Promise<HonorRecap> {
  const { data } = await httpClient.get<HonorRecap>("/pengelola/honor", {
    params: month ? { bulan: monthKey(month) } : undefined,
  })
  return data
}

export const honorRecapQuery = (month?: Date) =>
  queryOptions({
    queryKey: ["honor", "rekap", month ? monthKey(month) : "now"],
    queryFn: () => getHonorRecap(month),
  })

/*
 * Hitung (ulang) rekap dari presensi final bulan tsb; tutor tanpa tarif
 * dilewati, pembayaran yang sudah tercatat dipertahankan. Tutor mendapat
 * notifikasi dari BE.
 */
export async function calculateHonor(
  month: Date
): Promise<{ tutors: number; total: number }> {
  const { data } = await httpClient.post<{ tutors: number; total: number }>(
    "/pengelola/honor/hitung",
    { bulan: monthKey(month) }
  )
  return data
}

/* ---------- Rincian honor satu tutor ---------- */

export class HonorNotFoundError extends Error {
  constructor() {
    super("Rincian honor tidak ditemukan.")
    this.name = "HonorNotFoundError"
  }
}

function findHonor(monthParam: string, tutorId: string) {
  const recap = recaps.get(monthParam)
  const honor = recap?.honors.find((h) => h.tutorId === tutorId)
  if (!recap || !honor) throw new HonorNotFoundError()
  return { recap, honor }
}

const statusOf = (h: TutorHonor): HonorDetail["status"] =>
  !h.payment
    ? "belum_bayar"
    : h.payment.amount >= h.total
      ? "lunas"
      : "sebagian"

export async function getHonorDetail(
  monthParam: string,
  tutorId: string
): Promise<HonorDetail> {
  assertMockAllowed()
  await delay(300)
  const { recap, honor } = findHonor(monthParam, tutorId)
  return structuredClone({
    ...honor,
    month: recap.month,
    status: statusOf(honor),
    sessionList: recap.sessionsByTutor[tutorId],
  })
}

export const honorDetailQuery = (monthParam: string, tutorId: string) =>
  queryOptions({
    queryKey: ["honor", "rincian", monthParam, tutorId],
    queryFn: () => getHonorDetail(monthParam, tutorId),
  })

export async function recordHonorPayment(
  monthParam: string,
  tutorId: string,
  input: HonorPaymentInput
): Promise<HonorDetail> {
  assertMockAllowed()
  await delay(800)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const { recap, honor } = findHonor(monthParam, tutorId)
  honor.payment = { ...input, recordedAt: new Date() }
  return structuredClone({
    ...honor,
    month: recap.month,
    status: statusOf(honor),
  })
}

export { monthKey }
