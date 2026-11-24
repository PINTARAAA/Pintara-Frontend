import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { isToday, isTomorrow } from "date-fns"
import { CalendarIcon, ClockIcon, RotateCwIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { EmptyNote } from "@/features/dashboard/components/empty-note"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { StudentSwitcher } from "@/features/dashboard/components/student-switcher"
import {
  formatTimeSlot,
  waliScheduleQuery,
  WEEKDAYS,
} from "@/features/jadwal/api/jadwal"
import {
  CHANGE_STATUS_LABEL,
  formatChangeTitle,
} from "@/features/jadwal/lib/format"
import {
  formatDateRange,
  formatDayMonth,
  formatTimeRange,
  formatWeekdayDate,
} from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * W4 · Jadwal Les (tab) · Figma "Jadwal Les / Daftar" dan
 * "Jadwal Les / Daftar - Ada pengajuan".
 *
 * Student switcher → [Pengajuan perubahan] → Minggu ini (sesi 7 hari ke
 * depan, "Hari ini"/"Besok" di kanan) → Jadwal rutin (ketuk → detail).
 * Anak yang dipilih disimpan di ?siswa=… agar tetap sama saat kembali.
 */
function JadwalLes() {
  const [params, setParams] = useSearchParams()
  const studentId = params.get("siswa") ?? undefined
  const query = useQuery({
    ...waliScheduleQuery(studentId),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  return (
    <TabScreen
      title="Jadwal Les"
      action={
        <NotificationButton
          to="/wali/notifikasi"
          unread={data?.unreadNotifications}
        />
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat jadwal…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Jadwal gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "flex flex-col gap-ns-2xl transition-opacity",
            query.isPlaceholderData && "opacity-60"
          )}
        >
          <StudentSwitcher
            students={data.students}
            value={data.activeStudentId}
            onValueChange={(id) => setParams({ siswa: id }, { replace: true })}
          />

          {data.pendingRequests.length > 0 && (
            <DashboardSection title="Pengajuan perubahan">
              <DashboardList>
                {data.pendingRequests.map((request) => (
                  <ListItem
                    key={request.id}
                    icon={<RotateCwIcon />}
                    title={formatChangeTitle(request)}
                    description={`${CHANGE_STATUS_LABEL[request.status]} · diajukan ${formatDayMonth(request.submittedAt)}`}
                    chevron
                    render={<Link to={`/wali/jadwal/pengajuan/${request.id}`} />}
                  />
                ))}
              </DashboardList>
            </DashboardSection>
          )}

          <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
            <DashboardSection
              title="Minggu ini"
              description={formatDateRange(data.week.from, data.week.to)}
            >
              {data.week.sessions.length > 0 ? (
                <DashboardList>
                  {data.week.sessions.map((session) => (
                    <ListItem
                      key={session.id}
                      icon={<CalendarIcon />}
                      title={`${session.subject} · ${formatWeekdayDate(session.start)}`}
                      description={`${formatTimeRange(session.start, session.end)} · ${session.tutorName}`}
                      trailingText={
                        isToday(session.start)
                          ? "Hari ini"
                          : isTomorrow(session.start)
                            ? "Besok"
                            : undefined
                      }
                    />
                  ))}
                </DashboardList>
              ) : (
                <EmptyNote>Tidak ada les minggu ini.</EmptyNote>
              )}
            </DashboardSection>

            <DashboardSection
              title="Jadwal rutin"
              description="Ketuk untuk melihat detail atau mengajukan perubahan"
            >
              {data.routines.length > 0 ? (
                <DashboardList>
                  {data.routines.map((routine) => (
                    <ListItem
                      key={routine.id}
                      icon={<ClockIcon />}
                      title={`${routine.subject} · setiap ${WEEKDAYS[routine.weekday]}`}
                      description={`${formatTimeSlot(routine.startTime, routine.durationMinutes)} · ${routine.tutor.name}`}
                      chevron
                      render={<Link to={`/wali/jadwal/${routine.id}`} />}
                    />
                  ))}
                </DashboardList>
              ) : (
                <EmptyNote>
                  Jadwal les akan tampil setelah diatur oleh Pengelola LBB.
                </EmptyNote>
              )}
            </DashboardSection>
          </div>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { JadwalLes }
