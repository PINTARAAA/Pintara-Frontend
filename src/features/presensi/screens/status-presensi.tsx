import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useSearchParams } from "react-router"

import {
  DetailScreen,
  Button,
  DataState,
  FilterPill,
  ListItem,
  StackedProgressBar,
} from "@/components"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"
import { attendanceStatusQuery } from "@/features/presensi/api"
import type { AttendanceStatusOverview, TutorSession } from "@/types/presensi"
import { sessionTitle } from "@/features/presensi/lib"
import { formatDayMonth, formatWeekdayDate, parseMonth } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * T3 · Status Presensi (tutor) · Figma "Status Presensi / Ringkasan" dan
 * "Status Presensi / Kosong".
 *
 * Pil bulan → kartu ringkasan (x dari y terkumpul, jumlah masuk honor,
 * Stacked progress bar + legenda) → Dikeberatan wali · Menunggu validasi
 * wali · Belum dikumpulkan (ketuk → isi presensi) · Terverifikasi (2
 * terbaru, "Lihat semua n" untuk membuka sisanya). Bulan di ?bulan=YYYY-MM.
 */
const monthKey = (d: Date) => format(d, "yyyy-MM")
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const VERIFIED_PREVIEW = 2

function StatusPresensi() {
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get("bulan"))
  const query = useQuery({
    ...attendanceStatusQuery(month),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  return (
    <DetailScreen title="Status Presensi" className="gap-ns-2xl">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat status presensi…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Status presensi gagal dimuat"
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
            label="Periode"
            menuLabel="Pilih bulan"
            value={monthKey(data.month)}
            options={data.months.map((m) => ({
              value: monthKey(m),
              label: monthLabel(m),
            }))}
            onValueChange={(v) => setParams({ bulan: v }, { replace: true })}
          />

          {data.total === 0 ? (
            <DataState
              state="empty"
              title="Belum ada presensi"
              description={`Presensi ${monthLabel(data.month)} akan muncul setelah Anda mengisi sesi pertama.`}
            />
          ) : (
            <StatusContent data={data} />
          )}
        </div>
      ) : null}
    </DetailScreen>
  )
}

function StatusContent({ data }: { data: AttendanceStatusOverview }) {
  const [showAllVerified, setShowAllVerified] = React.useState(false)
  const collected = data.total - data.notCollected.length
  const verified = showAllVerified
    ? data.verified
    : data.verified.slice(0, VERIFIED_PREVIEW)

  const detailLink = (s: TutorSession) => (
    <Link to={`/tutor/presensi/status/${s.id}`} />
  )

  return (
    <>
      <section
        aria-label="Ringkasan presensi"
        className="flex flex-col gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l"
      >
        <div className="flex flex-col gap-ns-s leading-normal">
          <p className="text-body font-bold text-grayscale-text-title">
            {collected} dari {data.total} presensi terkumpul
          </p>
          <p className="text-caption text-grayscale-text-caption">
            {data.verified.length} sudah masuk perhitungan honor
          </p>
        </div>
        <StackedProgressBar
          total={data.total}
          showLegend
          remainderLabel="Belum dikumpulkan"
          segments={[
            { label: "Terverifikasi", value: data.verified.length, tone: "success" },
            { label: "Menunggu wali", value: data.waiting.length, tone: "warning" },
            { label: "Keberatan", value: data.disputed.length, tone: "error" },
          ]}
        />
      </section>

      {data.disputed.length > 0 && (
        <DashboardSection title="Dikeberatan wali">
          <DashboardList>
            {data.disputed.map((s) => (
              <ListItem
                key={s.id}
                title={sessionTitle(s)}
                description={`${formatWeekdayDate(s.start)} · "${shorten(s.record?.objection?.reason ?? "")}"`}
                chevron
                render={detailLink(s)}
              />
            ))}
          </DashboardList>
        </DashboardSection>
      )}

      {data.waiting.length > 0 && (
        <DashboardSection title="Menunggu validasi wali">
          <DashboardList>
            {data.waiting.map((s) => (
              <ListItem
                key={s.id}
                title={sessionTitle(s)}
                description={
                  s.record?.held === false
                    ? `${formatWeekdayDate(s.start)} · tidak terlaksana`
                    : `${formatWeekdayDate(s.start)} · diisi ${formatDayMonth(s.record!.submittedAt)}, ${format(s.record!.submittedAt, "HH.mm")}`
                }
                chevron
                render={detailLink(s)}
              />
            ))}
          </DashboardList>
        </DashboardSection>
      )}

      {data.notCollected.length > 0 && (
        <DashboardSection title="Belum dikumpulkan">
          <DashboardList>
            {data.notCollected.map((s) => (
              <ListItem
                key={s.id}
                title={sessionTitle(s)}
                description={`${formatWeekdayDate(s.start)} · isi sekarang`}
                chevron
                render={<Link to={`/tutor/presensi/${s.id}`} />}
              />
            ))}
          </DashboardList>
        </DashboardSection>
      )}

      {data.verified.length > 0 && (
        <section className="flex flex-col gap-ns-m">
          <div className="flex items-center justify-between gap-ns-s">
            <h2 className="text-body leading-normal font-bold text-grayscale-text-title">
              Terverifikasi
            </h2>
            {data.verified.length > VERIFIED_PREVIEW && (
              <Button
                variant="tertiary"
                size="sm"
                className="-my-ns-s -mr-ns-l"
                aria-expanded={showAllVerified}
                onClick={() => setShowAllVerified((v) => !v)}
              >
                {showAllVerified
                  ? "Tampilkan lebih sedikit"
                  : `Lihat semua ${data.verified.length}`}
              </Button>
            )}
          </div>
          <DashboardList>
            {verified.map((s) => (
              <ListItem
                key={s.id}
                title={sessionTitle(s)}
                description={formatWeekdayDate(s.start)}
                render={detailLink(s)}
              />
            ))}
          </DashboardList>
        </section>
      )}
    </>
  )
}

/* Kutipan singkat keberatan: 5 kata pertama + "…" */
function shorten(text: string, words = 5) {
  const parts = text.replace(/[.”"]+$/, "").split(/\s+/)
  return parts.length > words
    ? `${parts.slice(0, words).join(" ").replace(/[,;:]$/, "")}…`
    : parts.join(" ")
}

export { StatusPresensi }
