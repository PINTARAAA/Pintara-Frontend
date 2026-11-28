import { queryOptions } from "@tanstack/react-query"
import { format, startOfMonth } from "date-fns"

import { httpClient, isApiError } from "@/lib/api"
import type {
  HonorDetail,
  HonorPaymentInput,
  HonorRecap,
  HonorPaymentMethod,
} from "@/types/keuangan"

/*
 * Rekap & Pembayaran Honor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P7 · Rekap & Pembayaran Honor
 *
 * Sudah memakai BE:
 *   getHonorRecap(bulan)              → GET /pengelola/honor
 *   calculateHonor(bulan)             → POST /pengelola/honor/hitung
 *   getHonorDetail(bulan, tutorId)    → GET /pengelola/honor/:bulan/:tutorId
 *   recordHonorPayment(bulan, id, …)  → POST /pengelola/honor/:bulan/:tutorId/bayar
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

/* 404 dari BE (rekap belum dihitung / tutor tidak ada di rekap) */
export const isHonorNotFoundError = (error: unknown) =>
  isApiError(error) && error.code === "not_found"

/* monthParam = "2026-11"; sessionList = presensi final tutor bulan tsb */
export async function getHonorDetail(
  monthParam: string,
  tutorId: string
): Promise<HonorDetail> {
  const { data } = await httpClient.get<HonorDetail>(
    `/pengelola/honor/${encodeURIComponent(monthParam)}/${encodeURIComponent(tutorId)}`
  )
  return data
}

export const honorDetailQuery = (monthParam: string, tutorId: string) =>
  queryOptions({
    queryKey: ["honor", "rincian", monthParam, tutorId],
    queryFn: () => getHonorDetail(monthParam, tutorId),
  })

/* Unggahan bukti (maks. 5 MB) butuh waktu lebih lama dari batas umum 15 detik */
const UPLOAD_TIMEOUT_MS = 120_000

/*
 * Catat pembayaran honor (multipart: method, paidAt, amount, file `proof`).
 * `amount` = total yang sudah dibayar (BE menyimpan satu pembayaran per
 * honor dan menimpanya). Kembalikan rincian honor terbaru.
 */
export async function recordHonorPayment(
  monthParam: string,
  tutorId: string,
  input: HonorPaymentInput,
  onProgress?: (percent: number) => void
): Promise<HonorDetail> {
  const form = new FormData()
  form.append("method", input.method)
  form.append("paidAt", input.paidAt.toISOString())
  form.append("amount", String(input.amount))
  form.append("proof", input.proof)
  const { data } = await httpClient.post<HonorDetail>(
    `/pengelola/honor/${encodeURIComponent(monthParam)}/${encodeURIComponent(tutorId)}/bayar`,
    form,
    {
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    }
  )
  return data
}

export { monthKey }
