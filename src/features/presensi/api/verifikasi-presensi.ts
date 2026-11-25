import { queryOptions } from "@tanstack/react-query"
import { isAfter, isSameMonth, startOfMonth, subMonths } from "date-fns"

import { assertMockAllowed, delay } from "@/features/dashboard/api/mock"
import { addNotification } from "@/features/notifikasi/api/notifikasi"
import {
  finalizeReadySessions,
  isReadyForFinal,
  NotFoundError,
  resolveObjection,
  snapshotTutorSessions,
  type ObjectionResolution,
  type TutorSession,
} from "@/features/presensi/api/presensi"

/*
 * Verifikasi Final Presensi (pengelola) · Figma PINTARA → UI Screen →
 * Pengelola LBB → P6 · Verifikasi Final Presensi
 *
 * TODO(backend):
 *   getFinalOverview(bulan)       → httpClient.get("/pengelola/presensi", { params: { bulan } })
 *   finalizeAttendance(bulan)     → httpClient.post("/pengelola/presensi/final", { bulan })
 *   getObjection(sessionId)       → httpClient.get(`/pengelola/presensi/${id}/keberatan`)
 *   reviewObjection(sessionId, …) → httpClient.post(`/pengelola/presensi/${id}/keberatan`, …)
 *
 * Selama backend belum ada (mode development): presensi Kak Budi diambil
 * dari data presensi tutor (T2–T4, termasuk keberatan Aisyah), tutor lain
 * berupa angka contoh per bulan.
 */
export const BUDI = { name: "Kak Budi Santoso", shortName: "Kak Budi" }

type Counts = {
  final: number
  ready: number
  waiting: number
  notCollected: number
}

/* Angka contoh tutor lain untuk bulan berjalan (bulan lalu: semua final) */
const otherTutors: { name: string; counts: Counts }[] = [
  {
    name: "Kak Laila Fitri",
    counts: { final: 52, ready: 7, waiting: 1, notCollected: 1 },
  },
  {
    name: "Kak Dimas Arya",
    counts: { final: 48, ready: 5, waiting: 1, notCollected: 1 },
  },
  {
    name: "Kak Nadia Safitri",
    counts: { final: 41, ready: 0, waiting: 1, notCollected: 0 },
  },
]

const total = (c: Counts) => c.final + c.ready + c.waiting + c.notCollected

/* ---------- Ringkasan per bulan ---------- */

export type FinalOverview = {
  months: Date[]
  month: Date
  total: number
  final: number
  ready: number
  waiting: number
  disputed: number
  notCollected: number
  objections: TutorSession[]
  /* Presensi lengkap per tutor, terbanyak dulu */
  readyByTutor: { tutor: string; count: number }[]
}

function buildOverview(month: Date): FinalOverview {
  const now = new Date()
  const current = startOfMonth(now)
  const active = startOfMonth(month)
  const isCurrent = active.getTime() === current.getTime()

  const budi = snapshotTutorSessions().filter(
    (s) => isSameMonth(s.start, active) && !isAfter(s.start, now)
  )
  const budiCounts: Counts = {
    final: budi.filter((s) => s.record?.finalAt).length,
    ready: budi.filter(isReadyForFinal).length,
    waiting: budi.filter((s) => s.record?.validation === "belum_divalidasi")
      .length,
    notCollected: budi.filter((s) => !s.record).length,
  }
  const objections = budi
    .filter((s) => s.record?.validation === "keberatan")
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  /* Bulan lalu: presensi tutor lain sudah final semua */
  const others = otherTutors.map((t) => ({
    name: t.name,
    counts: isCurrent
      ? t.counts
      : { final: total(t.counts), ready: 0, waiting: 0, notCollected: 0 },
  }))

  const sum = (key: keyof Counts) =>
    budiCounts[key] + others.reduce((acc, t) => acc + t.counts[key], 0)

  return {
    months: [current, subMonths(current, 1)],
    month: active,
    total:
      sum("final") +
      sum("ready") +
      sum("waiting") +
      sum("notCollected") +
      objections.length,
    final: sum("final"),
    ready: sum("ready"),
    waiting: sum("waiting"),
    disputed: objections.length,
    notCollected: sum("notCollected"),
    objections,
    readyByTutor: [
      { tutor: BUDI.name, count: budiCounts.ready },
      ...others.map((t) => ({ tutor: t.name, count: t.counts.ready })),
    ]
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count),
  }
}

export async function getFinalOverview(month?: Date): Promise<FinalOverview> {
  assertMockAllowed()
  await delay()
  return buildOverview(month ?? new Date())
}

export const finalOverviewQuery = (month?: Date) =>
  queryOptions({
    queryKey: [
      "presensi",
      "final",
      month ? startOfMonth(month).getTime() : "now",
    ],
    queryFn: () => getFinalOverview(month),
  })

/* Verifikasi final semua presensi lengkap di bulan tsb; kembalikan jumlahnya */
export async function finalizeAttendance(month: Date): Promise<number> {
  assertMockAllowed()
  await delay(900)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const isCurrent = isSameMonth(month, new Date())
  let count = finalizeReadySessions(month)
  if (isCurrent) {
    otherTutors.forEach((t) => {
      count += t.counts.ready
      t.counts.final += t.counts.ready
      t.counts.ready = 0
    })
  }
  return count
}

/* ---------- Tinjau keberatan ---------- */

export async function getObjection(sessionId: string): Promise<TutorSession> {
  assertMockAllowed()
  await delay(300)
  const session = snapshotTutorSessions().find((s) => s.id === sessionId)
  if (!session) throw new NotFoundError()
  return session
}

export const objectionQuery = (sessionId: string) =>
  queryOptions({
    queryKey: ["presensi", "keberatan", sessionId],
    queryFn: () => getObjection(sessionId),
  })

export async function reviewObjection(
  sessionId: string,
  input: ObjectionResolution
): Promise<TutorSession> {
  assertMockAllowed()
  await delay(800)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const session = resolveObjection(sessionId, input)
  addNotification({
    kind: "validasi",
    title: "Keberatan presensi sudah ditinjau",
    body: input.corrected
      ? `${session.subject} · waktu dikoreksi ${input.actualStart}–${input.actualEnd}`
      : `${session.subject} · data tutor dinyatakan sesuai`,
    to: "/wali/riwayat",
  })
  return session
}
