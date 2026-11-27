import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format, isToday, isTomorrow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CalendarIcon, UserPlusIcon } from "lucide-react"
import { Link } from "react-router"

import {
  Button,
  TabScreen,
  StatusBadge,
  DataState,
  ListItem,
  Skeleton,
} from "@/components"
import { waliDashboardQuery } from "@/features/dashboard/api"
import {
  DashboardSkeleton,
  EmptyNote,
  DashboardList,
  DashboardSection,
  HeroCard,
  HeroCardRow,
  InitialsAvatar,
  NotificationButton,
  StudentSwitcher,
  TaskActionList,
  TaskList,
} from "@/features/dashboard/components"
import type { WaliDashboardData } from "@/types/dashboard"
import { ongoingRegistrationsQuery } from "@/features/pendaftaran/api"
import type { Registration } from "@/types/pendaftaran"

import { useUnreadNotifications } from "@/features/notifikasi/api"

import {
  formatGreeting,
  formatRelativeDay,
  formatSessionTime,
  formatShortWeekdayDate,
  formatTimeRange,
  formatTimeUntil,
  formatWeekdayDate,
} from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * Beranda Wali Murid · Figma PINTARA → UI Screen → Wali Murid → W1 · Beranda
 *
 * Mobile (< lg, frame "Wali / Beranda"): Student switcher, kartu Les
 *   berikutnya, Perlu tindakan, Jadwal minggu ini, Riwayat sesi — satu kolom.
 * Desktop (≥ lg, frame "Wali / Beranda (Desktop)"): halaman putih, Page
 *   header berisi sapaan + nama (H3) dengan Student switcher dan lonceng di
 *   kanan. Kolom utama: Perlu tindakan (tombol aksi langsung, tugas mendesak
 *   di atas) dan Agenda minggu ini (les berikutnya disorot). Kolom samping
 *   340px bergaris kiri: Riwayat sesi. Kedua versi dirender terpisah agar
 *   tampilan mobile tidak berubah.
 *
 * Tambahan di luar Figma (jalan masuk W2/W3 untuk wali yang sudah punya
 * akun): item "Daftarkan anak" di Student switcher, dan bagian "Pendaftaran
 * berjalan" (hanya bila ada) yang menautkan ke Status Pendaftaran — mobile
 * setelah Perlu tindakan, desktop di atas Riwayat sesi.
 */
function WaliDashboard() {
  const unreadNotifications = useUnreadNotifications()
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
        <NotificationButton
          to="/wali/notifikasi"
          unread={unreadNotifications}
        />
      }
      desktopHeader="page"
      desktopHeaderActions={
        <>
          {data && (
            <StudentSwitcher
              students={data.students}
              value={data.activeStudentId}
              onValueChange={setStudentId}
              align="end"
              addStudentTo="/wali/pendaftaran"
            />
          )}
          <NotificationButton
            to="/wali/notifikasi"
            unread={unreadNotifications}
            className="size-11 border border-grayscale-border-default bg-grayscale-surface-default"
          />
        </>
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
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "flex flex-1 flex-col transition-opacity",
            query.isPlaceholderData && "opacity-60"
          )}
        >
          <MobileDashboard data={data} onStudentChange={setStudentId} />
          <DesktopDashboard data={data} />
        </div>
      ) : null}
    </TabScreen>
  )
}

function MobileDashboard({
  data,
  onStudentChange,
}: {
  data: WaliDashboardData
  onStudentChange: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-ns-2xl lg:hidden">
      <StudentSwitcher
        students={data.students}
        value={data.activeStudentId}
        onValueChange={onStudentChange}
        addStudentTo="/wali/pendaftaran"
      />

      {data.nextSession ? (
        <HeroCard
          to="/wali/jadwal"
          label={`Les berikutnya: ${data.nextSession.subject}, ${formatSessionTime(data.nextSession.start, data.nextSession.end)}`}
          eyebrow="Les berikutnya"
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
                  initials={data.nextSession.tutor.initials}
                  tone="inverse"
                />
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

      <OngoingRegistrations variant="list" />

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
  )
}

function DesktopDashboard({ data }: { data: WaliDashboardData }) {
  const taskCount = data.tasks.length

  return (
    <div className="hidden flex-1 grid-cols-[minmax(0,1fr)_21.25rem] gap-ns-4xl lg:grid">
      <div className="flex flex-col gap-12">
        <DashboardSection
          title={
            <>
              Perlu tindakan
              {taskCount > 0 && (
                <span className="rounded-full bg-error-subtle px-ns-s py-ns-3xs text-caption leading-normal font-bold text-error">
                  <span className="sr-only">(</span>
                  {taskCount}
                  <span className="sr-only"> tugas)</span>
                </span>
              )}
            </>
          }
          headingClassName="flex min-h-9 items-center gap-ns-s text-headline"
        >
          <TaskActionList appearance="wali" tasks={data.tasks} />
        </DashboardSection>

        <DashboardSection
          title="Agenda minggu ini"
          headingClassName="text-headline"
          action={{ label: "Lihat jadwal", to: "/wali/jadwal" }}
        >
          <AgendaList data={data} />
        </DashboardSection>
      </div>

      <aside className="flex flex-col gap-12 border-l border-grayscale-border-default pl-ns-4xl">
        <OngoingRegistrations variant="rows" />
        <DashboardSection
          title="Riwayat sesi"
          headingClassName="text-headline"
          action={{ label: "Lihat semua", to: "/wali/riwayat" }}
          className="gap-ns-l"
        >
          {data.history.length > 0 ? (
            <ul>
              {data.history.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-grayscale-border-default last:border-b-0"
                >
                  <Link
                    to="/wali/riwayat"
                    className="group flex flex-col items-start gap-ns-2xs py-ns-l leading-normal outline-none focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
                  >
                    <span className="text-body font-bold text-grayscale-text-title group-hover:underline">
                      {item.subject} · {formatShortWeekdayDate(item.date)}
                    </span>
                    <span className="text-subtitle text-grayscale-text-subtitle">
                      {item.topic}
                    </span>
                    <StatusBadge category="presensi" status={item.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>Belum ada sesi yang selesai.</EmptyNote>
          )}
        </DashboardSection>
      </aside>
    </div>
  )
}

/* Label tahap pendaftaran yang masih berjalan */
const ONGOING_STAGE: Record<
  "menunggu_verifikasi" | "pencocokan_tutor",
  { description: string; badge: "menunggu_verifikasi" | "terverifikasi" }
> = {
  menunggu_verifikasi: {
    description: "Menunggu verifikasi Pengelola LBB",
    badge: "menunggu_verifikasi",
  },
  pencocokan_tutor: {
    description: "Sedang dicarikan tutor",
    badge: "terverifikasi",
  },
}

/*
 * Pendaftaran berjalan · daftar pendaftaran yang belum selesai, tiap baris
 * ke Status Pendaftaran (W3). Tidak dirender bila kosong/gagal dimuat agar
 * Beranda wali yang tidak sedang mendaftar tetap sesuai Figma.
 *   variant="list" : mobile, kotak daftar seperti bagian lain
 *   variant="rows" : desktop kolom samping, baris bergaris seperti Riwayat sesi
 */
function OngoingRegistrations({ variant }: { variant: "list" | "rows" }) {
  const query = useQuery(ongoingRegistrationsQuery())
  const items = query.data ?? []
  if (items.length === 0) return null

  const to = (r: Registration) =>
    `/wali/pendaftaran/status?id=${encodeURIComponent(r.id)}`
  const stage = (r: Registration) =>
    ONGOING_STAGE[r.stage as keyof typeof ONGOING_STAGE]

  return (
    <DashboardSection
      title="Pendaftaran berjalan"
      headingClassName={variant === "rows" ? "text-headline" : undefined}
      className={variant === "rows" ? "gap-ns-l" : undefined}
    >
      {variant === "list" ? (
        <DashboardList>
          {items.map((r) => (
            <ListItem
              key={r.id}
              icon={<UserPlusIcon />}
              title={r.studentName}
              description={stage(r).description}
              badge={
                <StatusBadge category="pendaftaran" status={stage(r).badge} />
              }
              render={<Link to={to(r)} />}
            />
          ))}
        </DashboardList>
      ) : (
        <ul>
          {items.map((r) => (
            <li
              key={r.id}
              className="border-b border-grayscale-border-default last:border-b-0"
            >
              <Link
                to={to(r)}
                className="group flex flex-col items-start gap-ns-2xs py-ns-l leading-normal outline-none focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
              >
                <span className="text-body font-bold text-grayscale-text-title group-hover:underline">
                  {r.studentName}
                </span>
                <span className="text-subtitle text-grayscale-text-subtitle">
                  {stage(r).description}
                </span>
                <StatusBadge category="pendaftaran" status={stage(r).badge} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  )
}

/* Kotak tanggal agenda 64×72: hari singkat kapital ("RAB") di atas tanggal H4 */
function AgendaDate({ date, className }: { date: Date; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-18 w-16 shrink-0 flex-col items-center justify-center rounded-(--comp-radius-md) font-bold",
        className
      )}
    >
      <span className="text-caption leading-normal text-primary-text-primary uppercase">
        {format(date, "EEE", { locale: localeId })}
      </span>
      <span className="text-h4 text-grayscale-text-title">
        {format(date, "d")}
      </span>
    </span>
  )
}

/*
 * Agenda minggu ini (desktop): les berikutnya disorot dalam kartu
 * Primary/Surface/subtitle (radius 16, padding 20) berisi tutor dan tombol
 * "Ajukan perubahan"; les lain minggu ini tampil sebagai baris ringkas.
 */
function AgendaList({ data }: { data: WaliDashboardData }) {
  const next = data.nextSession

  if (!next && data.weekSchedule.length === 0) {
    return <EmptyNote>Tidak ada les minggu ini.</EmptyNote>
  }

  const nextBadge =
    next && (isToday(next.start) || isTomorrow(next.start))
      ? `${formatRelativeDay(next.start)} · Les berikutnya`
      : "Les berikutnya"

  return (
    <ul className="flex flex-col gap-ns-s">
      {next && (
        <li className="flex items-center gap-ns-xl rounded-(--comp-radius-lg) bg-primary-surface-subtitle p-ns-xl">
          <AgendaDate
            date={next.start}
            className="bg-grayscale-surface-default"
          />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-ns-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to={`/wali/jadwal/${next.routineId}`}
                className="rounded-(--comp-radius-sm) text-h4 font-bold text-grayscale-text-title outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
              >
                {next.subject}
              </Link>
              <span className="rounded-full bg-primary-surface-default px-2.5 py-[3px] text-caption leading-normal font-bold text-primary-text-label">
                {nextBadge}
              </span>
            </div>
            <p className="text-body leading-normal text-grayscale-text-title">
              {formatSessionTime(next.start, next.end)}
            </p>
            <div className="flex items-center gap-ns-s">
              <InitialsAvatar
                initials={next.tutor.initials}
                tone="inverse"
                className="size-6 text-footnote"
              />
              <p className="text-subtitle leading-normal text-grayscale-text-subtitle">
                {next.tutor.name} · {next.tutor.specialty}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={<Link to={`/wali/jadwal/${next.routineId}/ubah`} />}
          >
            Ajukan perubahan
          </Button>
        </li>
      )}
      {data.weekSchedule.map((item) => (
        <li key={item.id}>
          <Link
            to={`/wali/jadwal/${item.routineId}`}
            className="flex items-center gap-ns-xl rounded-(--comp-radius-lg) px-ns-xl py-ns-m outline-none transition-colors hover:bg-grayscale-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
          >
            <AgendaDate
              date={item.start}
              className="bg-grayscale-surface-subtitle"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
              <span className="text-body font-bold text-grayscale-text-title">
                {item.subject}
              </span>
              <span className="text-subtitle text-grayscale-text-subtitle">
                {formatSessionTime(item.start, item.end)} · {item.tutorName}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export { WaliDashboard }
