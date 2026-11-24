import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { CalendarIcon } from "lucide-react"
import { Link } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { StatusBadge } from "@/components/ui/badge"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { waliDashboardQuery } from "@/features/dashboard/api/wali-dashboard"
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton"
import { EmptyNote } from "@/features/dashboard/components/empty-note"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { HeroCard, HeroCardRow } from "@/features/dashboard/components/hero-card"
import { InitialsAvatar } from "@/features/dashboard/components/initials-avatar"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { StudentSwitcher } from "@/features/dashboard/components/student-switcher"
import { TaskList } from "@/features/dashboard/components/task-list"
import {
  formatGreeting,
  formatSessionTime,
  formatShortWeekdayDate,
  formatTimeRange,
  formatTimeUntil,
  formatWeekdayDate,
} from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

function WaliDashboard() {
  const [studentId, setStudentId] = React.useState<string>()
  const query = useQuery({
    ...waliDashboardQuery(studentId),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  return (
    <TabScreen
      subtitle={formatGreeting()}
      title={data?.parent.name ?? <Skeleton className="h-6 w-48" />}
      action={
        <NotificationButton to="/wali/notifikasi" unread={data?.unreadNotifications} />
      }
    >
      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Beranda gagal dimuat"
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
            onValueChange={setStudentId}
          />

          <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
            {data.nextSession ? (
              <HeroCard
                to="/wali/jadwal"
                label={`Les berikutnya: ${data.nextSession.subject}, ${formatSessionTime(data.nextSession.start, data.nextSession.end)}`}
                eyebrow="Les berikutnya"
                badge={formatTimeUntil(data.nextSession.start)}
                title={data.nextSession.subject}
                subtitle={formatSessionTime(data.nextSession.start, data.nextSession.end)}
                footer={
                  <HeroCardRow
                    leading={
                      <InitialsAvatar initials={data.nextSession.tutor.initials} tone="inverse" />
                    }
                    title={data.nextSession.tutor.name}
                    description={data.nextSession.tutor.specialty}
                  />
                }
              />
            ) : (
              <HeroCard
                eyebrow="Les berikutnya"
                title="Belum ada jadwal"
                subtitle="Jadwal les akan tampil setelah diatur oleh Pengelola LBB."
              />
            )}

            <DashboardSection title="Perlu tindakan">
              <TaskList tasks={data.tasks} />
            </DashboardSection>

            <DashboardSection
              title="Jadwal minggu ini"
              action={{ label: "Lihat jadwal", to: "/wali/jadwal" }}
            >
              {data.weekSchedule.length > 0 ? (
                <DashboardList>
                  {data.weekSchedule.map((item) => (
                    <ListItem
                      key={item.id}
                      icon={<CalendarIcon />}
                      title={`${item.subject} · ${formatWeekdayDate(item.start)}`}
                      description={`${formatTimeRange(item.start, item.end)} · ${item.tutorName}`}
                      render={<Link to="/wali/jadwal" />}
                    />
                  ))}
                </DashboardList>
              ) : (
                <EmptyNote>Tidak ada les minggu ini.</EmptyNote>
              )}
            </DashboardSection>

            <DashboardSection
              title="Riwayat sesi"
              action={{ label: "Lihat semua", to: "/wali/riwayat" }}
            >
              {data.history.length > 0 ? (
                <DashboardList>
                  {data.history.map((item) => (
                    <ListItem
                      key={item.id}
                      title={`${item.subject} · ${formatShortWeekdayDate(item.date)}`}
                      description={item.topic}
                      badge={<StatusBadge category="presensi" status={item.status} />}
                      render={<Link to="/wali/riwayat" />}
                    />
                  ))}
                </DashboardList>
              ) : (
                <EmptyNote>Belum ada sesi yang selesai.</EmptyNote>
              )}
            </DashboardSection>
          </div>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { WaliDashboard }
