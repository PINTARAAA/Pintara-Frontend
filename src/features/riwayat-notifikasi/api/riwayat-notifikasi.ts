import { queryOptions } from "@tanstack/react-query"
import {
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api"
import {
  CHANNEL_LABEL,
  type Channel,
} from "@/features/pengaturan-notifikasi/api"

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
export type LogStatus = "terkirim" | "gagal"

export type NotificationKind =
  | "pengingat-jadwal"
  | "pengingat-presensi"
  | "pendaftaran-baru"
  | "hasil-verifikasi"
  | "penawaran-tutor"
  | "keberatan-presensi"
  | "rekap-honor"

export const KIND_LABEL: Record<NotificationKind, string> = {
  "pengingat-jadwal": "Pengingat jadwal les",
  "pengingat-presensi": "Pengingat presensi",
  "pendaftaran-baru": "Pendaftaran baru",
  "hasil-verifikasi": "Hasil verifikasi pendaftaran",
  "penawaran-tutor": "Penawaran tutor",
  "keberatan-presensi": "Keberatan presensi",
  "rekap-honor": "Rekap honor siap",
}

export type Recipient = {
  name: string
  role: "tutor" | "wali" | "pengelola"
  contact: string
  /* Akun di Manajemen Akun (P10), untuk "Ubah Kontak" */
  accountId?: string
}

export type NotificationLog = {
  id: string
  kind: NotificationKind
  channel: Channel
  recipients: Recipient[]
  sentAt: Date
  status: LogStatus
  message: string
  attempts: number
  lastAttemptAt: Date
  /* Gagal saja: penyebab lengkap (detail) dan ringkas (daftar) */
  reason?: string
  reasonShort?: string
  /* Penyebab yang tidak hilang dengan kirim ulang (kontak tidak valid) */
  permanent?: boolean
  resentAt?: Date
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

/* ---------- Data contoh ---------- */

const yoga: Recipient = { name: "Kak Yoga Pratama", role: "tutor", contact: "0838-0000-1212", accountId: "ak-tt-yoga" }
const andi: Recipient = { name: "Andi Saputra", role: "wali", contact: "0813-4400-1122", accountId: "ak-wali-4" }
const budi: Recipient = { name: "Kak Budi Santoso", role: "tutor", contact: "0857-1122-3344", accountId: "ak-tt-budi" }
const dimas: Recipient = { name: "Kak Dimas Arya", role: "tutor", contact: "0812-4455-6677", accountId: "ak-tt-dimas" }
const ila: Recipient = { name: "Kak Ila", role: "pengelola", contact: "ila.pintara@gmail.com" }
const sari: Recipient = { name: "Sari Wulandari", role: "wali", contact: "0812-3456-7890", accountId: "ak-wali-1" }

let seq = 0
const log = (
  kind: NotificationKind,
  recipients: Recipient[],
  sentAt: Date,
  message: string,
  extra: Partial<NotificationLog> = {}
): NotificationLog => ({
  id: `log-${++seq}`,
  kind,
  channel: kind === "pendaftaran-baru" || kind === "keberatan-presensi" || kind === "rekap-honor" ? "aplikasi" : "whatsapp",
  recipients,
  sentAt,
  status: "terkirim",
  message,
  attempts: 1,
  lastAttemptAt: sentAt,
  ...extra,
})

const logs: NotificationLog[] = [
  log("pengingat-presensi", [yoga], at(0, 8), "Halo Kak Yoga, presensi les Fisika bersama Rafi Hidayat pada Senin, 23 Nov belum diisi. Mohon isi di PINTARA ya.", {
    status: "gagal",
    attempts: 3,
    lastAttemptAt: at(0, 8, 10),
    reason: "Nomor WhatsApp tidak aktif",
    reasonShort: "nomor tidak aktif",
    permanent: true,
  }),
  log("hasil-verifikasi", [andi], at(0, 7, 40), "Halo Pak Andi, pendaftaran Bima Maharani sudah diverifikasi. Lihat detailnya di PINTARA.", {
    status: "gagal",
    attempts: 2,
    lastAttemptAt: at(0, 7, 45),
    reason: "Tidak terjangkau",
    reasonShort: "tidak terjangkau",
  }),
  log("pengingat-presensi", [budi], at(0, 8), "Halo Kak Budi, presensi les IPA bersama Dimas Pratama pada Kamis, 26 Nov belum diisi. Mohon isi di PINTARA ya."),
  log("pengingat-jadwal", [dimas], at(0, 14), "Halo Kak Dimas, pengingat les Fisika bersama Rafi Hidayat hari ini pukul 16.00 di Jl. Kartini No. 7."),
  log("pendaftaran-baru", [ila], at(0, 7, 12), "Pendaftaran baru dari Agus Setiawan untuk Kirana Maharani (12 SMA). Segera verifikasi di PINTARA."),
  log("keberatan-presensi", [ila, budi], at(0, 9, 30), "Sari Wulandari mengajukan keberatan atas presensi Matematika Aisyah Putri pada 19 Nov."),
  /* Hari-hari sebelumnya */
  log("pengingat-jadwal", [budi], at(-1, 14), "Halo Kak Budi, pengingat les Matematika bersama Aisyah Putri hari ini pukul 16.00 di Jl. Trunojoyo No. 12."),
  log("penawaran-tutor", [dimas], at(-2, 10, 5), "Halo Kak Dimas, ada penawaran les Matematika untuk Nadia Salsabila setiap Selasa 16.00. Konfirmasi di PINTARA."),
  log("hasil-verifikasi", [sari], at(-3, 11), "Halo Ibu Sari, pendaftaran Aisyah Putri sudah diverifikasi. Lihat detailnya di PINTARA."),
  log("pengingat-presensi", [yoga], at(-1, 8), "Halo Kak Yoga, presensi les Fisika bersama Rafi Hidayat pada Senin, 23 Nov belum diisi. Mohon isi di PINTARA ya.", {
    status: "gagal",
    attempts: 3,
    lastAttemptAt: at(-1, 8, 10),
    reason: "Nomor WhatsApp tidak aktif",
    reasonShort: "nomor tidak aktif",
    permanent: true,
  }),
  /* Bulan lalu */
  log("penawaran-tutor", [budi], at(-40, 9), "Halo Kak Budi, ada penawaran les IPA untuk Aisyah Putri setiap Jumat 16.00. Konfirmasi di PINTARA."),
  log("rekap-honor", [ila], at(-27, 7), "Semua presensi Oktober 2026 sudah final. Rekap honor siap dihitung di PINTARA."),
]

/* ---------- Filter ---------- */

export type Period = "hari-ini" | "7-hari" | "bulan-ini" | "bulan-lalu"

export const PERIODS: Period[] = ["hari-ini", "7-hari", "bulan-ini", "bulan-lalu"]

export function inPeriod(date: Date, period: Period, now = new Date()) {
  if (period === "hari-ini") return isSameDay(date, now)
  if (period === "7-hari") return date >= subDays(startOfDay(now), 6)
  if (period === "bulan-ini") return isSameMonth(date, now)
  return isSameMonth(date, subMonths(startOfMonth(now), 1))
}

export type LogFilter = {
  status?: LogStatus
  kind?: NotificationKind
  period: Period
}

export type LogList = {
  failed: NotificationLog[]
  sent: NotificationLog[]
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
