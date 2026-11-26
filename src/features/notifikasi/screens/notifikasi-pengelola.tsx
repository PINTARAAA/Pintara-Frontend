import type * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BellIcon,
  CircleCheckIcon,
  RotateCwIcon,
  TriangleAlertIcon,
  UserPlusIcon,
  WalletIcon,
} from "lucide-react"

import {
  markAllPengelolaRead,
  markPengelolaRead,
  pengelolaNotificationsQuery,
  type PengelolaNotificationKind,
} from "@/features/notifikasi/api"
import { NotificationScreen } from "@/features/notifikasi/components"

/*
 * P14 · Notifikasi (pengelola) · Figma "Notifikasi / Pengelola"
 *
 * Baru: pendaftaran baru, pengajuan perubahan jadwal, notifikasi gagal
 * terkirim, keberatan presensi. Sebelumnya: penawaran diterima, pembayaran
 * tagihan masuk. Kerangka daftar di NotificationScreen (sama dengan W9 · T7).
 */
const ICONS: Record<PengelolaNotificationKind, React.ReactNode> = {
  pendaftaran: <UserPlusIcon />,
  "perubahan-jadwal": <RotateCwIcon />,
  "notifikasi-gagal": <BellIcon />,
  keberatan: <TriangleAlertIcon />,
  penawaran: <CircleCheckIcon />,
  pembayaran: <WalletIcon />,
}

function NotifikasiPengelola() {
  const query = useQuery(pengelolaNotificationsQuery())
  return (
    <NotificationScreen
      query={query}
      queryKey={pengelolaNotificationsQuery().queryKey}
      icons={ICONS}
      markRead={markPengelolaRead}
      markAllRead={markAllPengelolaRead}
      emptyDescription="Pendaftaran baru, pengajuan jadwal, dan keberatan presensi akan muncul di sini."
    />
  )
}

export { NotifikasiPengelola }
