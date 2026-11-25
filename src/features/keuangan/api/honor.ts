import { queryOptions } from "@tanstack/react-query"
import { format, startOfMonth, subMonths } from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"
import {
  finalByTutor,
  finalProgress,
} from "@/features/presensi/api/verifikasi-presensi"
import type { TutorSession } from "@/features/presensi/api/presensi"

/*
 * Rekap & Pembayaran Honor · Figma PINTARA → UI Screen → Pengelola LBB →
 * P7 · Rekap & Pembayaran Honor
 *
 * TODO(backend):
 *   getHonorRecap(bulan)              → httpClient.get("/pengelola/honor", { params: { bulan } })
 *   calculateHonor(bulan)             → httpClient.post("/pengelola/honor/hitung", { bulan })
 *   getHonorDetail(bulan, tutorId)    → httpClient.get(`/pengelola/honor/${bulan}/${tutorId}`)
 *   recordHonorPayment(bulan, id, …)  → httpClient.post(`/pengelola/honor/${bulan}/${id}/bayar`, form)
 *
 * Honor = Σ (presensi terverifikasi final × tarif per sesi). Presensi final
 * diambil dari P6; tutor tanpa tarif ditandai dan tidak ikut dihitung.
 * PINTARA hanya mencatat pembayaran — dana dibayar di luar aplikasi.
 */
export type PaymentMethod = "tunai" | "transfer"

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  tunai: "Tunai di LBB",
  transfer: "Transfer",
}

type TutorProfile = {
  id: string
  name: string
  shortName: string
  /* Tarif honor per sesi (Rupiah); null = belum diatur */
  rate: number | null
  method: PaymentMethod
  methodNote?: string
}

const tutorProfiles: TutorProfile[] = [
  {
    id: "tt-budi",
    name: "Kak Budi Santoso",
    shortName: "Kak Budi",
    rate: 60_000,
    method: "tunai",
    methodNote: "Diambil langsung tiap awal bulan",
  },
  {
    id: "tt-laila",
    name: "Kak Laila Fitri",
    shortName: "Kak Laila",
    rate: 60_000,
    method: "transfer",
  },
  {
    id: "tt-dimas",
    name: "Kak Dimas Arya",
    shortName: "Kak Dimas",
    rate: 60_000,
    method: "transfer",
  },
  {
    id: "tt-nadia",
    name: "Kak Nadia Safitri",
    shortName: "Kak Nadia",
    rate: 50_000,
    method: "transfer",
  },
  {
    id: "tt-yoga",
    name: "Kak Yoga Pratama",
    shortName: "Kak Yoga",
    rate: null,
    method: "transfer",
  },
]

export type HonorPayment = {
  amount: number
  method: PaymentMethod
  paidAt: Date
  proof: { name: string; size: number }
  recordedAt: Date
}

export type HonorLine = {
  subject: string
  sessions: number
  rate: number
  amount: number
}

export type TutorHonor = {
  tutorId: string
  name: string
  shortName: string
  lines: HonorLine[]
  sessions: number
  total: number
  method: PaymentMethod
  methodNote?: string
  payment?: HonorPayment
}

type Recap = {
  month: Date
  calculatedAt: Date
  honors: TutorHonor[]
  /* Tutor yang dilewati karena tarif belum diatur */
  skipped: string[]
  /* Rincian sesi per tutor (bila tersedia) */
  sessionsByTutor: Record<string, TutorSession[]>
}

const monthKey = (d: Date) => format(startOfMonth(d), "yyyy-MM")

/* ---------- Data contoh: rekap bulan lalu sudah dibayar semua ---------- */

const recaps = new Map<string, Recap>()

;(() => {
  const october = subMonths(startOfMonth(new Date()), 1)
  const seed: [string, Record<string, number>, PaymentMethod, Date][] = [
    ["tt-budi", { Matematika: 7, IPA: 6 }, "tunai", at(-24, 10)],
    ["tt-laila", { Matematika: 54 }, "transfer", at(-23, 9)],
    ["tt-dimas", { Fisika: 26, Matematika: 25 }, "transfer", at(-23, 9)],
    ["tt-nadia", { "Bahasa Inggris": 40 }, "transfer", at(-23, 9)],
  ]
  recaps.set(monthKey(october), {
    month: october,
    calculatedAt: at(-25, 8, 30),
    skipped: [],
    sessionsByTutor: {},
    honors: seed.map(([id, bySubject, method, paidAt]) => {
      const profile = tutorProfiles.find((t) => t.id === id)!
      const honor = buildHonor(profile, bySubject)
      honor.payment = {
        amount: honor.total,
        method,
        paidAt,
        proof: {
          name: `bukti_honor_${profile.shortName.split(" ")[1].toLowerCase()}_okt.jpg`,
          size: 640_000,
        },
        recordedAt: paidAt,
      }
      return honor
    }),
  })
})()

function buildHonor(
  profile: TutorProfile,
  bySubject: Record<string, number>
): TutorHonor {
  const rate = profile.rate ?? 0
  const lines = Object.entries(bySubject)
    .filter(([, n]) => n > 0)
    .map(([subject, sessions]) => ({
      subject,
      sessions,
      rate,
      amount: sessions * rate,
    }))
  return {
    tutorId: profile.id,
    name: profile.name,
    shortName: profile.shortName,
    lines,
    sessions: lines.reduce((acc, l) => acc + l.sessions, 0),
    total: lines.reduce((acc, l) => acc + l.amount, 0),
    method: profile.method,
    methodNote: profile.methodNote,
  }
}

/* ---------- Rekap per bulan (tab Honor Tutor) ---------- */

export type HonorRecap =
  | {
      state: "belum_dihitung"
      months: Date[]
      month: Date
      final: number
      total: number
      tutorsWithoutRate: string[]
    }
  | {
      state: "dihitung"
      months: Date[]
      month: Date
      calculatedAt: Date
      total: number
      sessions: number
      paid: { amount: number; tutors: number }
      unpaid: { amount: number; tutors: number }
      unpaidHonors: TutorHonor[]
      paidHonors: TutorHonor[]
      skipped: string[]
    }

const isPaid = (h: TutorHonor) => !!h.payment && h.payment.amount >= h.total

export async function getHonorRecap(month?: Date): Promise<HonorRecap> {
  assertMockAllowed()
  await delay()
  const current = startOfMonth(new Date())
  const active = startOfMonth(month ?? current)
  const months = [current, subMonths(current, 1)]
  const recap = recaps.get(monthKey(active))

  if (!recap) {
    const progress = finalProgress(active)
    const tutorsWithFinals = finalByTutor(active).map((t) => t.tutor)
    return {
      state: "belum_dihitung",
      months,
      month: active,
      final: progress.final,
      total: progress.total,
      tutorsWithoutRate: tutorProfiles
        .filter((t) => t.rate === null && tutorsWithFinals.includes(t.name))
        .map((t) => t.name),
    }
  }

  const byAmount = (a: TutorHonor, b: TutorHonor) => b.total - a.total
  const paidHonors = recap.honors.filter(isPaid)
  const unpaidHonors = recap.honors.filter((h) => !isPaid(h))
  const sum = (list: TutorHonor[], pick: (h: TutorHonor) => number) =>
    list.reduce((acc, h) => acc + pick(h), 0)

  return structuredClone({
    state: "dihitung" as const,
    months,
    month: active,
    calculatedAt: recap.calculatedAt,
    total: sum(recap.honors, (h) => h.total),
    sessions: sum(recap.honors, (h) => h.sessions),
    paid: {
      amount: sum(recap.honors, (h) =>
        Math.min(h.payment?.amount ?? 0, h.total)
      ),
      tutors: paidHonors.length,
    },
    unpaid: {
      amount: sum(unpaidHonors, (h) => h.total - (h.payment?.amount ?? 0)),
      tutors: unpaidHonors.length,
    },
    unpaidHonors: unpaidHonors.sort(byAmount),
    paidHonors: paidHonors.sort(
      (a, b) =>
        (b.payment?.paidAt.getTime() ?? 0) - (a.payment?.paidAt.getTime() ?? 0)
    ),
    skipped: recap.skipped,
  })
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

export class NotFoundError extends Error {
  constructor() {
    super("Rincian honor tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

export type HonorDetail = TutorHonor & {
  month: Date
  status: "lunas" | "sebagian" | "belum_bayar"
  sessionList?: TutorSession[]
}

function findHonor(monthParam: string, tutorId: string) {
  const recap = recaps.get(monthParam)
  const honor = recap?.honors.find((h) => h.tutorId === tutorId)
  if (!recap || !honor) throw new NotFoundError()
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

export type HonorPaymentInput = {
  method: PaymentMethod
  paidAt: Date
  amount: number
  proof: { name: string; size: number }
}

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
