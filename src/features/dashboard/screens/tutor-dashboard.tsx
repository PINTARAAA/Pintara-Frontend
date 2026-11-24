import { useQuery } from "@tanstack/react-query"
import { isToday } from "date-fns"
import { BookOpenIcon, CalendarIcon } from "lucide-react"
import { Link } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { tutorDashboardQuery } from "@/features/dashboard/api/tutor-dashboard"
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { EmptyNote } from "@/features/dashboard/components/empty-note"
import { HeroCard, HeroCardRow } from "@/features/dashboard/components/hero-card"
import { InitialsAvatar } from "@/features/dashboard/components/initials-avatar"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { TaskList } from "@/features/dashboard/components/task-list"
import {
  formatGreeting,
  formatSessionTime,
  formatTimeRange,
  formatTimeUntil,
  formatWeekdayDate,
} from "@/lib/format/date"

function TutorDashboard() {
  const query = useQuery(tutorDashboardQuery())
  const data = query.data

  return (
    <TabScreen
      subtitle={formatGreeting()}
      title={data?.tutor.name ?? <Skeleton className="h-6 w-48" />}
      action={
        <NotificationButton to="/tutor/notifikasi" unread={data?.unreadNotifications} />
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
        <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
          {data.nextSession ? (
            <HeroCard
              to="/tutor/jadwal"
              label={`Les berikutnya: ${data.nextSession.subject} bersama ${data.nextSession.student.name}, ${formatSessionTime(data.nextSession.start, data.nextSession.end)}`}
              eyebrow={
                isToday(data.nextSession.start)
                  ? "Les berikutnya · Hari ini"
                  : "Les berikutnya"
              }
              badge={formatTimeUntil(data.nextSession.start)}
              title={data.nextSession.subject}
              subtitle={formatSessionTime(data.nextSession.start, data.nextSession.end)}
              footer={
                <HeroCardRow
                  leading={
                    <InitialsAvatar initials={data.nextSession.student.initials} tone="inverse" />
                  }
                  title={`${data.nextSession.student.name} · ${data.nextSession.student.grade}`}
                  description={data.nextSession.address}
                />
              }
            />
          ) : (
            <HeroCard
              eyebrow="Les berikutnya"
              title="Tidak ada les terjadwal"
              subtitle="Jadwal baru akan tampil setelah diatur oleh Pengelola LBB."
            />
          )}

          <DashboardSection title="Perlu tindakan">
            <TaskList tasks={data.tasks} />
          </DashboardSection>

          <DashboardSection
            title="Jadwal berikutnya"
            action={{ label: "Lihat jadwal", to: "/tutor/jadwal" }}
          >
            {data.upcoming.length > 0 ? (
              <DashboardList>
                {data.upcoming.map((item) => (
                  <ListItem
                    key={item.id}
                    icon={<CalendarIcon />}
                    title={`${item.subject} · ${item.studentName}`}
                    description={`${formatWeekdayDate(item.start)} · ${formatTimeRange(item.start, item.end)}`}
                    render={<Link to="/tutor/jadwal" />}
                  />
                ))}
              </DashboardList>
            ) : (
              <EmptyNote>Belum ada jadwal berikutnya.</EmptyNote>
            )}
          </DashboardSection>

          <DashboardSection title={`Rekap ${data.recap.month}`}>
            <DashboardList>
              <ListItem
                icon={<BookOpenIcon />}
                title={`${data.recap.held} sesi terlaksana`}
                description={`${data.recap.validated} tervalidasi · ${data.recap.waitingParent} menunggu wali · ${data.recap.disputed} dikeberatan`}
                chevron
                render={<Link to="/tutor/riwayat" />}
              />
            </DashboardList>
          </DashboardSection>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { TutorDashboard }
