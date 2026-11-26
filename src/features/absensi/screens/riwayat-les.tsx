import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useSearchParams } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  DataState,
  ListItem,
  FilterPill,
} from "@/components"
import { lessonHistoryQuery } from "@/features/absensi/api"
import type { LessonHistory } from "@/types/absensi"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"
import { formatShortWeekdayDate } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * W7 · Riwayat Les (wali) · Figma "Riwayat Les / Wali"
 *
 * Filter pil anak + bulan → kartu ringkasan (sesi terlaksana, tidak
 * terlaksana, sisa jadwal bulan ini, jumlah per mapel) → "Riwayat sesi"
 * (List item tanpa ikon + Badge presensi; sesi batal tanpa badge).
 * Filter disimpan di ?siswa=…&bulan=YYYY-MM.
 */
const monthKey = (d: Date) => format(d, "yyyy-MM")
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })

function parseMonth(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return undefined
  const [y, m] = value.split("-").map(Number)
  return new Date(y, m - 1, 1)
}

function RiwayatLes() {
  const [params, setParams] = useSearchParams()
  const studentId = params.get("siswa") ?? undefined
  const month = parseMonth(params.get("bulan"))
  const query = useQuery({
    ...lessonHistoryQuery(studentId, month),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  const update = (key: "siswa" | "bulan", value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    /* Ganti anak → kembali ke bulan berjalan */
    if (key === "siswa") next.delete("bulan")
    setParams(next, { replace: true })
  }

  return (
    <DetailScreen title="Riwayat Les" className="gap-ns-2xl">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat riwayat les…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Riwayat gagal dimuat"
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
          <div className="flex flex-wrap gap-ns-s">
            <FilterPill
              label="Anak"
              menuLabel="Tampilkan riwayat"
              value={data.studentId}
              options={data.students.map((s) => ({ value: s.id, label: s.name }))}
              onValueChange={(v) => update("siswa", v)}
            />
            <FilterPill
              label="Bulan"
              menuLabel="Pilih bulan"
              value={monthKey(data.month)}
              options={data.months.map((m) => ({
                value: monthKey(m),
                label: monthLabel(m),
              }))}
              onValueChange={(v) => update("bulan", v)}
            />
          </div>

          {data.sessions.length > 0 ? (
            <>
              <SummaryCard data={data} />
              <DashboardSection title="Riwayat sesi">
                <DashboardList>
                  {data.sessions.map((session) => (
                    <ListItem
                      key={session.id}
                      title={`${session.subject} · ${formatShortWeekdayDate(session.start)}`}
                      description={
                        session.cancelReason
                          ? `Tidak terlaksana · ${session.cancelReason}`
                          : session.topic
                      }
                      badge={
                        session.cancelReason ? undefined : (
                          <StatusBadge category="presensi" status={session.status} />
                        )
                      }
                      render={<Link to={`/wali/riwayat/${session.id}`} />}
                    />
                  ))}
                </DashboardList>
              </DashboardSection>
            </>
          ) : (
            <DataState
              state="empty"
              title="Belum ada sesi"
              description={`Belum ada sesi les di ${monthLabel(data.month)}.`}
            />
          )}
        </div>
      ) : null}
    </DetailScreen>
  )
}

/* Kartu ringkasan: padding 16, gap 12, garis pemisah, baris per mapel */
function SummaryCard({ data }: { data: LessonHistory }) {
  const { held, cancelled, upcoming, bySubject } = data.summary
  const notes = [
    cancelled > 0 && `${cancelled} tidak terlaksana`,
    upcoming > 0 && `${upcoming} sesi lagi terjadwal bulan ini`,
  ].filter(Boolean)

  return (
    <section
      aria-label="Ringkasan bulan ini"
      className="flex flex-col gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l leading-normal"
    >
      <div className="flex flex-col gap-ns-2xs">
        <p className="text-body font-bold text-grayscale-text-title">
          {held} sesi terlaksana di{" "}
          {format(data.month, "MMMM", { locale: localeId })}
        </p>
        {notes.length > 0 && (
          <p className="text-caption text-grayscale-text-caption">
            {notes.join(" · ")}
          </p>
        )}
      </div>
      {bySubject.length > 0 && (
        <>
          <div aria-hidden="true" className="h-px bg-grayscale-border-disabled" />
          <dl className="flex flex-col gap-ns-m text-subtitle">
            {bySubject.map(({ subject, count }) => (
              <div key={subject} className="flex items-start justify-between gap-ns-m">
                <dt className="text-grayscale-text-body">{subject}</dt>
                <dd className="font-bold text-grayscale-text-title">{count} sesi</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}

export { RiwayatLes }
