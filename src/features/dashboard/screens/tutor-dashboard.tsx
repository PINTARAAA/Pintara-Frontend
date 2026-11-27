import { useQuery } from "@tanstack/react-query"
import { isToday, isTomorrow } from "date-fns"
import { BookOpenIcon, CalendarIcon } from "lucide-react"
import { Link } from "react-router"

import { TabScreen, DataState, ListItem, Skeleton } from "@/components"
import { tutorDashboardQuery } from "@/features/dashboard/api"
import { useTutorUnreadNotifications } from "@/features/notifikasi/api"
import {
  AgendaDate,
  DashboardSkeleton,
  DashboardList,
  DashboardSection,
  EmptyNote,
  HeroCard,
  HeroCardRow,
  InitialsAvatar,
  NotificationButton,
  TaskActionList,
  TaskList,
} from "@/features/dashboard/components"
import { ThemeButton } from "@/features/akun/components"
import type { TutorDashboardData } from "@/types/dashboard"

import {
  formatGreeting,
  formatSessionTime,
  formatTimeRange,
  formatTimeUntil,
  formatWeekdayDate,
} from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * Beranda Tutor · Figma PINTARA → UI Screen → Tutor → T1 · Beranda
 *
 * Mobile (< lg, frame "Tutor / Beranda"): kartu Les berikutnya, Perlu
 *   tindakan, Jadwal berikutnya, Rekap bulan ini — satu kolom.
 * Desktop (≥ lg, frame "Tutor / Beranda (Desktop)"): halaman putih, Page
 *   header berisi sapaan + nama (H3) dengan lonceng di kanan. Kolom utama
 *   (jarak 48): Perlu tindakan (tombol aksi langsung) dan Jadwal berikutnya
 *   (les berikutnya disorot). Kolom samping 340px bergaris kiri: Rekap bulan
 *   ini (angka H2 + rincian bertitik). Kedua versi dirender terpisah agar
 *   tampilan mobile tidak berubah.
 */
function TutorDashboard() {
  const query = useQuery(tutorDashboardQuery())
  const data = query.data
  const unread = useTutorUnreadNotifications()

  return (
    <TabScreen
      subtitle={formatGreeting()}
      title={data?.tutor.name ?? <Skeleton className="h-6 w-48" />}
      /* Mobile: shortcut tema di samping notifikasi (desktop: di sidebar) */
      action={
        <div className="flex items-center gap-ns-s">
          <ThemeButton />
          <NotificationButton to="/tutor/notifikasi" unread={unread} />
        </div>
      }
      desktopHeader="page"
      desktopHeaderActions={
        <NotificationButton
          to="/tutor/notifikasi"
          unread={unread}
          className="size-11 border border-grayscale-border-default bg-grayscale-surface-default"
        />
      }
      className="lg:pt-ns-4xl"
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
        <>
          <MobileDashboard data={data} />
          <DesktopDashboard data={data} />
        </>
      ) : null}
    </TabScreen>
  )
}

function MobileDashboard({ data }: { data: TutorDashboardData }) {
  return (
    <div className="flex flex-col gap-ns-2xl lg:hidden">
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
          subtitle={formatSessionTime(
            data.nextSession.start,
            data.nextSession.end
          )}
          footer={
            <HeroCardRow
              leading={
                <InitialsAvatar
                  initials={data.nextSession.student.initials}
                  tone="inverse"
                />
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
  )
}

function DesktopDashboard({ data }: { data: TutorDashboardData }) {
  const taskCount = data.tasks.length
  const { recap } = data
  const breakdown = [
    { label: "Tervalidasi", value: recap.validated, dot: "bg-success" },
    { label: "Menunggu wali", value: recap.waitingParent, dot: "bg-warning" },
    { label: "Dikeberatan", value: recap.disputed, dot: "bg-error" },
  ]

  return (
    <div className="hidden flex-1 grid-cols-[minmax(0,1fr)_21.25rem] gap-ns-4xl lg:grid">
      <div className="flex flex-col gap-12">
        <DashboardSection
          title={
            <>
              Perlu tindakan
              {taskCount > 0 && (
                <span className="rounded-full bg-error-subtle px-ns-s py-ns-3xs text-caption leading-normal font-bold text-grayscale-text-negative">
                  <span className="sr-only">(</span>
                  {taskCount}
                  <span className="sr-only"> tugas)</span>
                </span>
              )}
            </>
          }
          headingClassName="flex min-h-9 items-center gap-ns-s text-headline"
        >
          <TaskActionList appearance="tutor" tasks={data.tasks} />
        </DashboardSection>

        <DashboardSection
          title="Jadwal berikutnya"
          headingClassName="text-headline"
          action={{ label: "Lihat jadwal", to: "/tutor/jadwal" }}
        >
          <AgendaList data={data} />
        </DashboardSection>
      </div>

      <aside className="flex flex-col border-l border-grayscale-border-default pl-ns-4xl">
        <DashboardSection
          title={`Rekap ${recap.month}`}
          headingClassName="flex min-h-9 items-center text-headline"
          action={{ label: "Lihat riwayat", to: "/tutor/riwayat" }}
          className="gap-ns-l"
        >
          <p className="flex flex-col gap-ns-2xs">
            <span className="text-h2 font-bold text-grayscale-text-title">
              {recap.held}
            </span>
            <span className="text-subtitle leading-normal text-grayscale-text-subtitle">
              sesi terlaksana
            </span>
          </p>
          <dl className="border-t border-grayscale-border-default">
            {breakdown.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-ns-s border-b border-grayscale-border-default py-ns-m text-body leading-normal text-grayscale-text-title last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 shrink-0 rounded-full", row.dot)}
                />
                <dt className="flex-1">{row.label}</dt>
                <dd className="font-bold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </DashboardSection>
      </aside>
    </div>
  )
}

/*
 * Jadwal berikutnya (desktop): les berikutnya disorot dalam kartu
 * Primary/Surface/subtitle (radius 16, padding 20) berisi siswa · kelas ·
 * alamat; les lain tampil sebagai baris ringkas dengan kotak tanggal.
 */
function AgendaList({ data }: { data: TutorDashboardData }) {
  const next = data.nextSession

  if (!next && data.upcoming.length === 0) {
    return <EmptyNote>Belum ada jadwal berikutnya.</EmptyNote>
  }

  const nextBadge = !next
    ? null
    : isToday(next.start)
      ? `Hari ini · ${formatTimeUntil(next.start)}`
      : isTomorrow(next.start)
        ? "Besok · Les berikutnya"
        : "Les berikutnya"

  return (
    <ul className="flex flex-col gap-ns-s">
      {next && (
        <li>
          <Link
            to="/tutor/jadwal"
            className="flex items-center gap-ns-xl rounded-(--comp-radius-lg) bg-primary-surface-subtitle p-ns-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
          >
            <AgendaDate
              date={next.start}
              className="bg-grayscale-surface-default"
            />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-ns-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-h4 font-bold text-grayscale-text-title">
                  {next.subject}
                </span>
                <span className="rounded-full bg-primary-surface-default px-2.5 py-[3px] text-caption leading-normal font-bold text-primary-text-label">
                  {nextBadge}
                </span>
              </div>
              <p className="text-body leading-normal text-grayscale-text-title">
                {formatSessionTime(next.start, next.end)}
              </p>
              <div className="flex max-w-full items-center gap-ns-s">
                <InitialsAvatar
                  initials={next.student.initials}
                  tone="inverse"
                  className="size-6 text-footnote"
                />
                <p className="truncate text-subtitle leading-normal text-grayscale-text-subtitle">
                  {next.student.name} · {next.student.grade} · {next.address}
                </p>
              </div>
            </div>
          </Link>
        </li>
      )}
      {data.upcoming.map((item) => (
        <li key={item.id}>
          <Link
            to="/tutor/jadwal"
            className="flex items-center gap-ns-xl rounded-(--comp-radius-lg) px-ns-xl py-ns-s outline-none transition-colors hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
          >
            <AgendaDate
              date={item.start}
              className="bg-grayscale-surface-subtitle"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
              <span className="text-body font-bold text-grayscale-text-title">
                {item.subject} · {item.studentName}
              </span>
              <span className="text-subtitle text-grayscale-text-subtitle">
                {formatSessionTime(item.start, item.end)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export { TutorDashboard }
