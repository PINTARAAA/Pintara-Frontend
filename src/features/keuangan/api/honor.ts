import { queryOptions } from "@tanstack/react-query"
import { format, startOfMonth } from "date-fns"

import { finalByTutor } from "@/features/presensi/api"
import { httpClient } from "@/lib/api"
import { buildHonor, recaps, tutorProfiles } from "@/lib/data/keuangan"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  HonorDetail,
  HonorPaymentInput,
  HonorRecap,
  HonorPaymentMethod,
  TutorHonor,
} from "@/types/keuangan"
import type { TutorSession } from "@/types/presensi"

/*
 * Rekap & Pembayaran Honor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P7 · Rekap & Pembayaran Honor
 *
 * Sudah memakai BE:
 *   getHonorRecap(bulan)              → GET /pengelola/honor
 *
 * TODO(backend):
 *   calculateHonor(bulan)             → httpClient.post("/pengelola/honor/hitung", { bulan })
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

/* Hitung rekap dari presensi final; tutor tanpa tarif dilewati */
export async function calculateHonor(month: Date) {
  assertMockAllowed()
  await delay(900)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const active = startOfMonth(month)
  const previous = recaps.get(monthKey(active))
  const sources = finalByTutor(active)
  const skipped: string[] = []
  const sessionsByTutor: Record<string, TutorSession[]> = {}

  const honors = sources.flatMap((source) => {
    const profile = tutorProfiles.find((t) => t.name === source.tutor)
    if (!profile || profile.rate === null) {
      skipped.push(source.tutor)
      return []
    }
    if (source.sessions) sessionsByTutor[profile.id] = source.sessions
    const honor = buildHonor(profile, source.bySubject)
    /* Hitung ulang: pembayaran yang sudah tercatat tetap dipertahankan */
    honor.payment = previous?.honors.find(
      (h) => h.tutorId === profile.id
    )?.payment
    return [honor]
  })

  recaps.set(monthKey(active), {
    month: active,
    calculatedAt: new Date(),
    honors,
    skipped,
    sessionsByTutor,
  })
  return {
    tutors: honors.length,
    total: honors.reduce((acc, h) => acc + h.total, 0),
  }
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
