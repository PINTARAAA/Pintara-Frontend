import { useQuery } from "@tanstack/react-query"
import { ClipboardCheckIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { StatusBadge } from "@/components/ui/badge"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import {
  Tabs,
  TabsContent,
  TabsCount,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  attendanceQuery,
  type AttendanceSession,
} from "@/features/absensi/api/absensi"
import { firstName } from "@/features/absensi/lib/format"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { formatShortWeekdayDate, formatWeekdayDate } from "@/lib/format/date"

/*
 * W5 · Validasi Absensi (tab) · Figma "Validasi Absensi / Daftar sesi" dan
 * "Validasi Absensi / Kosong".
 *
 * Tabs di bawah top app bar: "Perlu Validasi" (dengan counter) · "Riwayat".
 * Tab aktif disimpan di ?tab=riwayat agar tetap sama saat kembali dari detail.
 * Riwayat belum punya frame di Figma; memakai List item + Badge presensi
 * seperti "Riwayat sesi" di Beranda.
 */
type TabValue = "perlu-validasi" | "riwayat"

function ValidasiAbsensi() {
  const [params, setParams] = useSearchParams()
  const tab: TabValue =
    params.get("tab") === "riwayat" ? "riwayat" : "perlu-validasi"
  const query = useQuery(attendanceQuery())
  const data = query.data

  /* Nama anak hanya perlu ditampilkan bila wali punya lebih dari satu anak */
  const who = (s: AttendanceSession) =>
    data?.multipleStudents ? `${firstName(s.studentName)} · ` : ""

  return (
    <Tabs
      value={tab}
      onValueChange={(value) =>
        setParams(value === "riwayat" ? { tab: "riwayat" } : {}, {
          replace: true,
        })
      }
      className="contents"
    >
      <TabScreen
        title="Validasi Absensi"
        action={
          <NotificationButton
            to="/wali/notifikasi"
            unread={data?.unreadNotifications}
          />
        }
        subheader={
          <TabsList className="w-full border-b border-grayscale-border-default *:-mb-px">
            <TabsTrigger value="perlu-validasi">
              Perlu Validasi
              {data && data.pending.length > 0 && (
                <TabsCount>{data.pending.length}</TabsCount>
              )}
            </TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          </TabsList>
        }
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
          <>
            <TabsContent value="perlu-validasi" className="flex flex-col">
              {data.pending.length > 0 ? (
                <div className="flex flex-col gap-ns-m">
                  <p className="text-caption leading-normal text-grayscale-text-caption">
                    Periksa kehadiran setiap sesi. Sesi yang disetujui akan
                    dihitung pada rekap honor tutor.
                  </p>
                  <DashboardList>
                    {data.pending.map((session) => (
                      <ListItem
                        key={session.id}
                        icon={<ClipboardCheckIcon />}
                        title={`${session.subject} · ${formatWeekdayDate(session.start)}`}
                        description={`${who(session)}${session.tutor.name} · ${session.topic}`}
                        chevron
                        render={<Link to={`/wali/absensi/${session.id}`} />}
                      />
                    ))}
                  </DashboardList>
                </div>
              ) : (
                <div className="flex flex-1 flex-col justify-center">
                  <DataState
                    state="empty"
                    title="Semua sesi sudah divalidasi"
                    description="Sesi les baru akan muncul di sini setelah tutor mengisi presensi."
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="riwayat" className="flex flex-col">
              {data.history.length > 0 ? (
                <DashboardList>
                  {data.history.map((session) => (
                    <ListItem
                      key={session.id}
                      title={`${session.subject} · ${formatShortWeekdayDate(session.start)}`}
                      description={`${who(session)}${session.topic}`}
                      badge={
                        <StatusBadge category="presensi" status={session.status} />
                      }
                      render={<Link to={`/wali/absensi/${session.id}`} />}
                    />
                  ))}
                </DashboardList>
              ) : (
                <div className="flex flex-1 flex-col justify-center">
                  <DataState
                    state="empty"
                    title="Belum ada riwayat"
                    description="Sesi yang sudah Anda validasi akan tampil di sini."
                  />
                </div>
              )}
            </TabsContent>
          </>
        ) : null}
      </TabScreen>
    </Tabs>
  )
}

export { ValidasiAbsensi }
