import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { TabScreen, DataState, FilterPill, ListItem } from "@/components";
import {
  DashboardList,
  DashboardSection,
  NotificationButton,
} from "@/features/dashboard/components";

import { useTutorUnreadNotifications } from "@/features/notifikasi/api";
import { tutorScheduleQuery } from "@/features/jadwal/api";
import type { TutorScheduleDay } from "@/types/jadwal";
import { formatWeekRange, joinDays } from "@/features/jadwal/lib";
import { formatTimeRange, formatWeekdayDate } from "@/lib/format";
import { cn } from "@/lib/styles";

/*
 * T5 · Jadwal (tab tutor) · Figma "Jadwal / Tutor".
 *
 * Pil minggu ("24–30 Nov 2026", 7 hari mulai hari ini; pilih hingga 3
 * minggu ke depan) → satu seksi per hari yang ada les ("Hari ini · Selasa,
 * 24 Nov") berisi List item mapel · siswa, jam · alamat (ketuk → detail)
 * → catatan hari tanpa les. Minggu terpilih disimpan di ?minggu=0..3.
 * Desktop (Figma "Jadwal / Tutor (Desktop)"): Page header "Jadwal" dengan
 * pil minggu di kanan; seksi hari satu kolom selebar 760px.
 */
const dayTitle = (date: Date) =>
  isToday(date)
    ? `Hari ini · ${formatWeekdayDate(date)}`
    : formatWeekdayDate(date);

function JadwalTutor() {
  const [params, setParams] = useSearchParams();
  const week = Number(params.get("minggu") ?? 0);
  const query = useQuery({
    ...tutorScheduleQuery(week),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const unread = useTutorUnreadNotifications();

  const weekPill = (align: "start" | "end") =>
    data && (
      <FilterPill
        label="Minggu"
        menuLabel="Pilih minggu"
        align={align}
        value={String(data.week)}
        options={data.weeks.map((w, i) => ({
          value: String(i),
          label: formatWeekRange(w.from, w.to),
        }))}
        onValueChange={(v) =>
          setParams(v === "0" ? {} : { minggu: v }, { replace: true })
        }
      />
    );

  return (
    <TabScreen
      title="Jadwal"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
      desktopHeader="page"
      desktopHeaderActions={weekPill("end")}
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
            "flex flex-col gap-ns-2xl transition-opacity lg:max-w-190",
            query.isPlaceholderData && "opacity-60",
          )}
        >
          {/* Desktop: pil minggu pindah ke kanan Page header */}
          <div className="lg:hidden">{weekPill("start")}</div>

          {data.days.length > 0 ? (
            <>
              <div className="flex flex-col gap-ns-2xl">
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
  );
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
  );
}

export { JadwalTutor };
