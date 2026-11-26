export type NotificationKind =
  | "validasi"
  | "tagihan"
  | "jadwal"
  | "pembayaran"
  | "les"

export type AppNotification<Kind extends string = NotificationKind> = {
  id: string
  kind: Kind
  title: string
  body: string
  createdAt: Date
  read: boolean
  /* Tujuan saat notifikasi diketuk */
  to: string
  /* Keterangan pengganti waktu, mis. "sedang ditinjau Pengelola" */
  status?: string
}

export type NotificationList<Kind extends string = NotificationKind> = {
  unread: AppNotification<Kind>[]
  read: AppNotification<Kind>[]
}

export type TutorNotificationKind =
  | "presensi"
  | "keberatan"
  | "pengingat"
  | "rekap"
  | "honor"

export type TutorNotification = AppNotification<TutorNotificationKind>

export type PengelolaNotificationKind =
  | "pendaftaran"
  | "perubahan-jadwal"
  | "notifikasi-gagal"
  | "keberatan"
  | "penawaran"
  | "pembayaran"

export type PengelolaNotification =
  AppNotification<PengelolaNotificationKind>
