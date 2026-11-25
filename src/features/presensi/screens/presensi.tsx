import { useQuery } from "@tanstack/react-query"
import { ClipboardCheckIcon, ClockIcon } from "lucide-react"
import { Link } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { useTutorUnreadNotifications } from "@/features/notifikasi/api/notifikasi-tutor"
import { tutorSessionsQuery } from "@/features/presensi/api/presensi"
import {
  formatToFill,
  formatWeekdayShort,
  sessionTitle,
} from "@/features/presensi/lib/format"
import { formatTimeRange } from "@/lib/format/date"

/*
 * T2 · Presensi (tab tutor) · Figma "Presensi / Daftar" dan "Presensi / Kosong"
 *
 * Perlu diisi (sesi sudah dimulai, belum dipresensi; ketuk → form) ·
 * Nanti hari ini (belum bisa diisi) · Sudah diisi (badge status validasi
 * wali; tautan "Status presensi" ke T3).
 */
function Presensi() {
  const query = useQuery(tutorSessionsQuery())
  const data = query.data
  const unread = useTutorUnreadNotifications()

  return (
    <TabScreen
      title="Presensi"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat sesi les…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Sesi les gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div className="flex flex-1 flex-col gap-ns-2xl lg:grid lg:grid-cols-2 lg:items-start">
          {data.toFill.length + data.laterToday.length === 0 ? (
            <div className="flex flex-1 flex-col justify-center gap-ns-l lg:col-span-2">
              <DataState
                state="empty"
                title="Tidak ada jadwal les hari ini"
                description="Presensi bisa diisi saat ada sesi les yang terjadwal."
              />
              <Button
                variant="tertiary"
                className="self-center"
                nativeButton={false}
                render={<Link to="/tutor/jadwal" />}
              >
                Lihat jadwal minggu ini
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-ns-2xl">
              {data.toFill.length > 0 && (
                <DashboardSection title="Perlu diisi">
                  <DashboardList>
                    {data.toFill.map((s) => (
                      <ListItem
                        key={s.id}
                        icon={<ClipboardCheckIcon />}
                        title={sessionTitle(s)}
                        description={formatToFill(s)}
                        chevron
                        render={<Link to={`/tutor/presensi/${s.id}`} />}
                      />
                    ))}
                  </DashboardList>
                </DashboardSection>
              )}
              {data.laterToday.length > 0 && (
                <DashboardSection title="Nanti hari ini">
                  <DashboardList>
                    {data.laterToday.map((s) => (
                      <ListItem
                        key={s.id}
                        icon={<ClockIcon />}
                        title={sessionTitle(s)}
                        description={`${formatTimeRange(s.start, s.end)} · bisa diisi setelah sesi dimulai`}
                      />
                    ))}
                  </DashboardList>
                </DashboardSection>
              )}
            </div>
          )}

          {data.filled.length > 0 && (
            <DashboardSection
              title="Sudah diisi"
              action={{ label: "Status presensi", to: "/tutor/presensi/status" }}
            >
              <DashboardList>
                {data.filled.map((s) => (
                  <ListItem
                    key={s.id}
                    icon={<ClipboardCheckIcon />}
                    title={sessionTitle(s)}
                    description={formatWeekdayShort(s.start)}
                    badge={
                      s.record && (
                        <StatusBadge category="presensi" status={s.record.validation} />
                      )
                    }
                    render={<Link to={`/tutor/presensi/status/${s.id}`} />}
                  />
                ))}
              </DashboardList>
            </DashboardSection>
          )}
        </div>
      ) : null}
    </TabScreen>
  )
}

export { Presensi }
