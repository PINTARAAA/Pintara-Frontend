import type { Channel } from "@/types/pengaturan-notifikasi"

export type LogStatus = "terkirim" | "gagal"

export type LogNotificationKind =
  | "pengingat-jadwal"
  | "pengingat-presensi"
  | "pendaftaran-baru"
  | "hasil-verifikasi"
  | "penawaran-tutor"
  | "keberatan-presensi"
  | "rekap-honor"

export type Recipient = {
  name: string
  role: "tutor" | "wali" | "pengelola"
  contact: string
  /* Akun di Manajemen Akun (P10), untuk "Ubah Kontak" */
  accountId?: string
}

export type NotificationLog = {
  id: string
  kind: LogNotificationKind
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

export type Period = "hari-ini" | "7-hari" | "bulan-ini" | "bulan-lalu"

export type LogFilter = {
  status?: LogStatus
  kind?: LogNotificationKind
  period: Period
}

export type LogList = {
  failed: NotificationLog[]
  sent: NotificationLog[]
}
