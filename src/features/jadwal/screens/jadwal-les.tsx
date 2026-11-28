import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { isToday, isTomorrow } from "date-fns"
import { CalendarIcon, ClockIcon, RotateCwIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { TabScreen, DataState, ListItem } from "@/components"
import {
  DashboardList,
  DashboardSection,
  EmptyNote,
  NotificationButton,
  StudentSwitcher,
} from "@/features/dashboard/components"

import { useUnreadNotifications } from "@/features/notifikasi/api"

import { waliScheduleQuery } from "@/features/jadwal/api"
import { getErrorMessage } from "@/lib/api"
import { formatTimeSlot, WEEKDAYS } from "@/lib/data/jadwal"
import { CHANGE_STATUS_LABEL, formatChangeTitle } from "@/features/jadwal/lib"
import {
  formatDateRange,
  formatDayMonth,
  formatTimeRange,
  formatWeekdayDate,
} from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * W4 · Jadwal Les (tab) · Figma "Jadwal Les / Daftar" dan
 * "Jadwal Les / Daftar - Ada pengajuan".
 *
 * Student switcher → [Pengajuan perubahan] → Minggu ini (sesi 7 hari ke
 * depan, "Hari ini"/"Besok" di kanan) → Jadwal rutin (ketuk → detail).
 * Anak yang dipilih disimpan di ?siswa=… agar tetap sama saat kembali.
 *
 * Desktop (≥ lg, frame "… (Desktop)"): halaman putih, Page header "Jadwal
 * Les" dengan Student switcher di kanan (lonceng ada di sidebar). Kolom
 * utama: [Pengajuan perubahan] + Minggu ini (jarak 32); kolom samping 400px:
 * Jadwal rutin; jarak antar kolom 40.
 */
function JadwalLes() {
  const unreadNotifications = useUnreadNotifications()
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
          unread={unreadNotifications}
        />
      }
      desktopHeader="page"
      desktopHeaderActions={
        data && (
          <StudentSwitcher
            students={data.students}
            value={data.activeStudentId}
            onValueChange={(id) => setParams({ siswa: id }, { replace: true })}
            align="end"
          />
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat jadwal…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Jadwal gagal dimuat"
          description={getErrorMessage(query.error)}
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
          <div className="lg:hidden">
            <StudentSwitcher
              students={data.students}
              value={data.activeStudentId}
              onValueChange={(id) =>
                setParams({ siswa: id }, { replace: true })
              }
            />
          </div>

          <div className="flex flex-col gap-ns-2xl lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-ns-4xl">
            <div className="flex flex-col gap-ns-2xl lg:gap-ns-3xl">
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
                        render={
                          <Link to={`/wali/jadwal/pengajuan/${request.id}`} />
                        }
                      />
                    ))}
                  </DashboardList>
                </DashboardSection>
              )}

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
            </div>

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
