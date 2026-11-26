import type * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  RotateCwIcon,
  WalletIcon,
} from "lucide-react"

import {
  markAllRead,
  markRead,
  notificationsQuery,
} from "@/features/notifikasi/api"
import { NotificationScreen } from "@/features/notifikasi/components"
import type { NotificationKind } from "@/types/notifikasi"

/*
 * W9 · Notifikasi (wali) · Figma "Notifikasi / Wali" dan "- Kosong"
 * Kerangka daftar ada di NotificationScreen.
 */
const ICONS: Record<NotificationKind, React.ReactNode> = {
  validasi: <ClipboardCheckIcon />,
  tagihan: <WalletIcon />,
  jadwal: <RotateCwIcon />,
  pembayaran: <CircleCheckIcon />,
  les: <CalendarIcon />,
}

function NotifikasiWali() {
  const query = useQuery(notificationsQuery())
  return (
    <NotificationScreen
      query={query}
      queryKey={notificationsQuery().queryKey}
      icons={ICONS}
      markRead={markRead}
      markAllRead={markAllRead}
      emptyDescription="Kabar soal jadwal, absensi, dan tagihan akan muncul di sini."
    />
  )
}

export { NotifikasiWali }
