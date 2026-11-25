import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { isToday } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { DataState } from "@/components/ui/data-state"
import { FilterPill } from "@/components/ui/filter-pill"
import { ListItem } from "@/components/ui/list-item"
import { tutorDashboardQuery } from "@/features/dashboard/api/tutor-dashboard"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import {
  tutorScheduleQuery,
  type TutorScheduleDay,
} from "@/features/jadwal/api/jadwal-tutor"
import { formatWeekRange, joinDays } from "@/features/jadwal/lib/format"
import { formatTimeRange, formatWeekdayDate } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * T5 · Jadwal (tab tutor) · Figma "Jadwal / Tutor".
 *
 * Pil minggu ("24–30 Nov 2026", 7 hari mulai hari ini; pilih hingga 3
 * minggu ke depan) → satu seksi per hari yang ada les ("Hari ini · Selasa,
 * 24 Nov") berisi List item mapel · siswa, jam · alamat (ketuk → detail)
 * → catatan hari tanpa les. Minggu terpilih disimpan di ?minggu=0..3.
 */
const dayTitle = (date: Date) =>
  isToday(date)
    ? `Hari ini · ${formatWeekdayDate(date)}`
    : formatWeekdayDate(date)

function JadwalTutor() {
  const [params, setParams] = useSearchParams()
  const week = Number(params.get("minggu") ?? 0)
  const query = useQuery({
    ...tutorScheduleQuery(week),
    placeholderData: keepPreviousData,
  })
  const data = query.data
  /* TODO(T7): ganti dengan jumlah dari layar Notifikasi tutor */
  const unread = useQuery({
    ...tutorDashboardQuery(),
    select: (d) => d.unreadNotifications,
  }).data

  return (
    <TabScreen
      title="Jadwal"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
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
          <FilterPill
            label="Minggu"
            menuLabel="Pilih minggu"
            value={String(data.week)}
            options={data.weeks.map((w, i) => ({
              value: String(i),
              label: formatWeekRange(w.from, w.to),
            }))}
            onValueChange={(v) =>
              setParams(v === "0" ? {} : { minggu: v }, { replace: true })
            }
          />

          {data.days.length > 0 ? (
            <>
              <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
                {data.days.map((day) => (
                  <DaySection key={day.date.getTime()} day={day} />
                ))}
              </div>
              {data.freeDays.length > 0 && (
                <p className="text-caption leading-normal text-grayscale-text-caption">
                  Tidak ada les pada {joinDays(data.freeDays)}.
                </p>
              )}
            </>
          ) : (
            <DataState
              state="empty"
              title="Tidak ada les minggu ini"
              description="Jadwal les akan tampil setelah diatur oleh Pengelola LBB."
            />
          )}
        </div>
      ) : null}
    </TabScreen>
  )
}

function DaySection({ day }: { day: TutorScheduleDay }) {
  return (
    <DashboardSection title={dayTitle(day.date)}>
      <DashboardList>
        {day.sessions.map((session) => (
          <ListItem
            key={session.id}
            icon={<CalendarIcon />}
            title={`${session.subject} · ${session.student.name}`}
            description={`${formatTimeRange(session.start, session.end)} · ${session.shortAddress}`}
            chevron
            render={<Link to={`/tutor/jadwal/${session.id}`} />}
          />
        ))}
      </DashboardList>
    </DashboardSection>
  )
}

export { JadwalTutor }
