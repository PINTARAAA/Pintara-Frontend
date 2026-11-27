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
import { formatShortWeekdayDate, parseMonth } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * W7 · Riwayat Les (wali) · Figma "Riwayat Les / Wali"
 *
 * Filter pil anak + bulan → kartu ringkasan (sesi terlaksana, tidak
 * terlaksana, sisa jadwal bulan ini, jumlah per mapel) → "Riwayat sesi"
 * (List item tanpa ikon + Badge presensi; sesi batal tanpa badge).
 * Filter disimpan di ?siswa=…&bulan=YYYY-MM.
 *
 * Desktop (≥ lg, frame "Riwayat Les / Wali (Desktop)"): halaman putih,
 * Page header "Riwayat Les" tanpa tautan kembali dengan pil filter di kanan;
 * "Riwayat sesi" di kolom utama dan kartu ringkasan 380px di kanan (jarak 32)
 * dengan heading "Riwayat Sesi Terlaksana" (khusus desktop, di luar Figma).
 */
const monthKey = (d: Date) => format(d, "yyyy-MM")
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })

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

  const filters = data && (
    <>
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
    </>
  )

  return (
    <DetailScreen
      title="Riwayat Les"
      desktopHeader="page"
      backLabel={null}
      desktopWidth="wide"
      desktopHeaderActions={
        filters && <div className="flex items-center gap-ns-s">{filters}</div>
      }
      className="gap-ns-2xl lg:pt-ns-3xl"
    >
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
          {/* Desktop: filter pindah ke Page header */}
          <div className="flex flex-wrap gap-ns-s lg:hidden">{filters}</div>

          {data.sessions.length > 0 ? (
            /*
             * Mobile: ringkasan lalu daftar (urutan DOM). Desktop: grid,
             * daftar di kolom kiri, ringkasan 380px di kanan.
             */
            <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:items-start lg:gap-ns-3xl">
              {/*
               * Desktop: heading di atas ringkasan agar sejajar dengan
               * judul "Riwayat sesi" di kolom kiri (mobile tanpa heading)
               */}
              <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-ns-m">
                <h2 className="hidden text-body leading-normal font-bold text-grayscale-text-title lg:block">
                  Riwayat Sesi Terlaksana
                </h2>
                <SummaryCard data={data} />
              </div>
              <DashboardSection
                title="Riwayat sesi"
                className="lg:col-start-1 lg:row-start-1"
              >
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
            </div>
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
function SummaryCard({
  data,
  className,
}: {
  data: LessonHistory
  className?: string
}) {
  const { held, cancelled, upcoming, bySubject } = data.summary
  const notes = [
    cancelled > 0 && `${cancelled} tidak terlaksana`,
    upcoming > 0 && `${upcoming} sesi lagi terjadwal bulan ini`,
  ].filter(Boolean)

  return (
    <section
      aria-label="Ringkasan bulan ini"
      className={cn(
        "flex flex-col gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l leading-normal",
        className
      )}
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
