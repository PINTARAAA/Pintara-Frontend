import { queryOptions } from "@tanstack/react-query"
import {
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"

import { CHANNEL_LABEL } from "@/features/pengaturan-notifikasi/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { logs } from "@/lib/data/riwayat-notifikasi"
import type {
  LogFilter,
  LogList,
  NotificationKind,
  NotificationLog,
  Period,
  Recipient,
} from "@/types/riwayat-notifikasi"

/*
 * Riwayat Notifikasi · Figma PINTARA → UI Screen → Pengelola LBB →
 * P13 · Riwayat Notifikasi
 *
 * TODO(backend):
 *   getNotificationLogs({ status, jenis, periode }) → httpClient.get("/pengelola/riwayat-notifikasi", { params })
 *   getNotificationLog(id)                          → httpClient.get(`/pengelola/riwayat-notifikasi/${id}`)
 *   resendNotification(id)                          → httpClient.post(`/pengelola/riwayat-notifikasi/${id}/kirim-ulang`)
 *   resendAllFailed(filter)                         → httpClient.post("/pengelola/riwayat-notifikasi/kirim-ulang", filter)
 *
 * Log dibuat setiap notifikasi dari P12 dikirim. Notifikasi gagal bisa
 * dikirim ulang; yang penyebabnya kontak tidak valid tetap gagal sampai
 * kontak penerima diperbarui (Manajemen Akun).
 */

export const KIND_LABEL: Record<NotificationKind, string> = {
  "pengingat-jadwal": "Pengingat jadwal les",
  "pengingat-presensi": "Pengingat presensi",
  "pendaftaran-baru": "Pendaftaran baru",
  "hasil-verifikasi": "Hasil verifikasi pendaftaran",
  "penawaran-tutor": "Penawaran tutor",
  "keberatan-presensi": "Keberatan presensi",
  "rekap-honor": "Rekap honor siap",
}

const ROLE_LABEL: Record<Recipient["role"], string> = {
  tutor: "tutor",
  wali: "wali",
  pengelola: "pengelola",
}

export const recipientLabel = (r: Recipient) => `${r.name} (${ROLE_LABEL[r.role]})`
export const channelContact = (log: Pick<NotificationLog, "channel" | "recipients">) =>
  log.recipients.length === 1 && log.channel !== "aplikasi"
    ? `${CHANNEL_LABEL[log.channel]} · ${log.recipients[0].contact}`
    : CHANNEL_LABEL[log.channel]

/* ---------- Filter ---------- */

export const PERIODS: Period[] = ["hari-ini", "7-hari", "bulan-ini", "bulan-lalu"]

export function inPeriod(date: Date, period: Period, now = new Date()) {
  if (period === "hari-ini") return isSameDay(date, now)
  if (period === "7-hari") return date >= subDays(startOfDay(now), 6)
  if (period === "bulan-ini") return isSameMonth(date, now)
  return isSameMonth(date, subMonths(startOfMonth(now), 1))
}

export async function getNotificationLogs(filter: LogFilter): Promise<LogList> {
  assertMockAllowed()
  await delay()
  const list = logs
    .filter(
      (l) =>
        inPeriod(l.resentAt ?? l.sentAt, filter.period) &&
        (!filter.kind || l.kind === filter.kind)
    )
    .sort(
      (a, b) =>
        (b.resentAt ?? b.sentAt).getTime() - (a.resentAt ?? a.sentAt).getTime()
    )
  return structuredClone({
    failed: filter.status === "terkirim" ? [] : list.filter((l) => l.status === "gagal"),
    sent: filter.status === "gagal" ? [] : list.filter((l) => l.status === "terkirim"),
  })
}

export const notificationLogsQuery = (filter: LogFilter) =>
  queryOptions({
    queryKey: ["riwayat-notifikasi", "daftar", filter],
    queryFn: () => getNotificationLogs(filter),
  })

/* ---------- Detail & kirim ulang ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Log notifikasi tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

function findLog(id: string) {
  const found = logs.find((l) => l.id === id)
  if (!found) throw new NotFoundError()
  return found
}

export async function getNotificationLog(id: string): Promise<NotificationLog> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(findLog(id))
}

export const notificationLogQuery = (id: string) =>
  queryOptions({
    queryKey: ["riwayat-notifikasi", "detail", id],
    queryFn: () => getNotificationLog(id),
  })

export class ResendFailedError extends Error {
  readonly reason: string
  constructor(reason: string) {
    super(`Kirim ulang gagal: ${reason}.`)
    this.name = "ResendFailedError"
    this.reason = reason
  }
}

function attempt(entry: NotificationLog) {
  const now = new Date()
  entry.attempts += 1
  entry.lastAttemptAt = now
  if (entry.permanent) return false
  entry.status = "terkirim"
  entry.reason = undefined
  entry.reasonShort = undefined
  entry.resentAt = now
  return true
}

export async function resendNotification(id: string): Promise<NotificationLog> {
  assertMockAllowed()
  await delay(900)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const entry = findLog(id)
  if (!attempt(entry)) throw new ResendFailedError(entry.reason ?? "kontak tidak valid")
  return structuredClone(entry)
}

/* Kirim ulang semua yang gagal sesuai filter; hasilnya dihitung per log */
export async function resendAllFailed(filter: LogFilter) {
  assertMockAllowed()
  await delay(1200)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const targets = logs.filter(
    (l) =>
      l.status === "gagal" &&
      inPeriod(l.sentAt, filter.period) &&
      (!filter.kind || l.kind === filter.kind)
  )
  const sent = targets.filter(attempt)
  return {
    sent: sent.map((l) => l.recipients.map((r) => r.name).join(", ")),
    stillFailed: targets.length - sent.length,
  }
}
