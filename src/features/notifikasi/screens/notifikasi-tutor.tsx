import type * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CircleCheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  TriangleAlertIcon,
  WalletIcon,
} from "lucide-react"

import {
  markAllTutorRead,
  markTutorRead,
  tutorNotificationsQuery,
} from "@/features/notifikasi/api"
import { NotificationScreen } from "@/features/notifikasi/components"
import type { TutorNotificationKind } from "@/types/notifikasi"

/*
 * T7 · Notifikasi (tutor) · Figma "Notifikasi / Tutor"
 *
 * Baru: presensi terlewat (→ isi presensi), keberatan dari wali (→ detail
 * presensi), pengingat jadwal (→ detail jadwal). Sebelumnya: rekap
 * presensi terverifikasi, honor dibayar. Kerangka daftar di
 * NotificationScreen (sama dengan W9).
 */
const ICONS: Record<TutorNotificationKind, React.ReactNode> = {
  presensi: <ClipboardCheckIcon />,
  keberatan: <TriangleAlertIcon />,
  pengingat: <ClockIcon />,
  rekap: <CircleCheckIcon />,
  honor: <WalletIcon />,
}

function NotifikasiTutor() {
  const query = useQuery(tutorNotificationsQuery())
  return (
    <NotificationScreen
      query={query}
      queryKey={tutorNotificationsQuery().queryKey}
      icons={ICONS}
      markRead={markTutorRead}
      markAllRead={markAllTutorRead}
      emptyDescription="Kabar soal jadwal, presensi, dan honor akan muncul di sini."
    />
  )
}

export { NotifikasiTutor }
