import * as React from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  ClipboardCheckIcon,
  ClockIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"

import {
  DetailScreen,
  ConfirmDialog,
  Button,
  DataState,
  FilterPill,
  ListItem,
  StackedProgressBar,
  toast,
} from "@/components"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"
import {
  BUDI,
  finalizeAttendance,
  finalOverviewQuery,
} from "@/features/presensi/api"
import type { FinalOverview } from "@/types/presensi"
import { firstName, formatWeekdayDate, parseMonth } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * P6 · Verifikasi Final Presensi · Figma "Verifikasi Presensi / Ringkasan",
 * "/ Konfirmasi" dan "/ Berhasil".
 *
 * Pil periode (bulan) → kartu ringkasan (N dari total final, Stacked
 * progress bar + legenda) → Keberatan wali (ketuk → tinjau) → Siap
 * diverifikasi per tutor → Belum lengkap (menunggu wali · belum dikumpulkan).
 * "Verifikasi N Presensi" membuka Confirmation modal; setelah final, tombol
 * berganti "Hitung Rekap Honor" (P7). Bulan disimpan di ?bulan=YYYY-MM.
 *
 * Desktop (Figma "… (Desktop)"): Page header tanpa tautan kembali; pil
 * periode dan tombol aksi di kanan header. Kolom kiri: Siap diverifikasi →
 * Keberatan wali; kolom kanan 420px: ringkasan → Belum lengkap (jarak 40).
 */
const monthKey = (d: Date) => format(d, "yyyy-MM")
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const monthName = (d: Date) => format(d, "MMMM", { locale: localeId })

function VerifikasiPresensi() {
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get("bulan"))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({
    ...finalOverviewQuery(month),
    placeholderData: keepPreviousData,
  })
  const data = query.data
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const periodPill = data && (
    <FilterPill
      label="Periode"
      menuLabel="Pilih periode"
      value={monthKey(data.month)}
      options={data.months.map((m) => ({
        value: monthKey(m),
        label: monthLabel(m),
      }))}
      onValueChange={(v) =>
        setParams(v === monthKey(data.months[0]) ? {} : { bulan: v }, {
          replace: true,
        })
      }
    />
  )

  const finalize = useMutation({
    mutationFn: () => finalizeAttendance(data?.month ?? new Date()),
    networkMode: "always",
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: ["presensi"] })
      void queryClient.invalidateQueries({ queryKey: ["notifikasi"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success(`${count} presensi terverifikasi final`, {
        description: `Rekap honor ${monthName(data?.month ?? new Date())} siap dihitung.`,
      })
    },
    onError: () =>
      toast.error("Verifikasi gagal", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  return (
    <DetailScreen
      title="Verifikasi Presensi"
      backLabel={null}
      desktopHeader="page"
      desktopActions="header"
      desktopWidth="wide"
      desktopHeaderActions={periodPill}
      footer={
        data &&
        (data.ready > 0 ? (
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={finalize.isPending || query.isPlaceholderData}
          >
            {finalize.isPending
              ? "Memverifikasi…"
              : `Verifikasi ${data.ready} Presensi`}
          </Button>
        ) : (
          <Button onClick={() => navigate("/pengelola/keuangan")}>
            Hitung Rekap Honor
          </Button>
        ))
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat presensi…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Presensi gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "gap-ns-2xl lg:gap-x-ns-4xl flex flex-col transition-opacity lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start",
            query.isPlaceholderData && "opacity-60"
          )}
        >
          {/* Desktop: pil periode pindah ke Page header */}
          <div className="lg:hidden">{periodPill}</div>

          <SummaryCard data={data} className="lg:col-start-2 lg:row-start-1" />

          <div className="gap-ns-2xl grid lg:contents">
            <div className="gap-ns-2xl flex flex-col lg:col-start-1 lg:row-span-2 lg:row-start-1">
              {data.objections.length > 0 && (
                <DashboardSection title="Keberatan wali">
                  <DashboardList>
                    {data.objections.map((s) => (
                      <ListItem
                        key={s.id}
                        icon={<TriangleAlertIcon />}
                        title={`${s.subject} · ${firstName(s.student.name)} × ${BUDI.shortName}`}
                        description={`${formatWeekdayDate(s.start)} · “${shortReason(s.record?.objection?.reason)}”`}
                        chevron
                        render={
                          <Link to={`/pengelola/presensi/keberatan/${s.id}`} />
                        }
                      />
                    ))}
                  </DashboardList>
                </DashboardSection>
              )}

              {data.ready > 0 && (
                <DashboardSection
                  title={`Siap diverifikasi · ${data.ready}`}
                  /* Desktop (Figma): Siap diverifikasi di atas Keberatan */
                  className="lg:order-first"
                >
                  <DashboardList>
                    {data.readyByTutor.map((t) => (
                      <ListItem
                        key={t.tutor}
                        icon={<UserIcon />}
                        title={t.tutor}
                        description={`${t.count} presensi lengkap`}
                        trailingText={t.count}
                      />
                    ))}
                  </DashboardList>
                </DashboardSection>
              )}
            </div>

            <div className="gap-ns-m flex flex-col lg:col-start-2 lg:row-start-2">
              {data.waiting + data.notCollected > 0 && (
                <DashboardSection
                  title={`Belum lengkap · ${data.waiting + data.notCollected}`}
                >
                  <DashboardList>
                    {data.waiting > 0 && (
                      <ListItem
                        icon={<ClockIcon />}
                        title="Menunggu validasi wali"
                        description="Pengingat terkirim ke wali"
                        trailingText={data.waiting}
                      />
                    )}
                    {data.notCollected > 0 && (
                      <ListItem
                        icon={<ClipboardCheckIcon />}
                        title="Belum dikumpulkan tutor"
                        description="Pengingat otomatis aktif"
                        trailingText={data.notCollected}
                      />
                    )}
                  </DashboardList>
                </DashboardSection>
              )}
              <p className="text-caption text-grayscale-text-caption leading-normal">
                Presensi yang belum lengkap tidak bisa diverifikasi final dan
                tidak dihitung ke rekap honor.
              </p>
            </div>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            showDismiss={false}
            title={`Verifikasi final ${data.ready} presensi?`}
            description={`Presensi akan dihitung ke rekap honor ${monthName(data.month)} dan tidak bisa lagi diubah oleh tutor.`}
            confirmLabel="Verifikasi"
            onConfirm={async () => {
              await finalize.mutateAsync().catch(() => undefined)
            }}
          />
        </div>
      ) : null}
    </DetailScreen>
  )
}

/* Kutipan singkat alasan keberatan untuk daftar */
function shortReason(reason?: string) {
  if (!reason) return "-"
  const first = reason.split(/[,.]/)[0].trim()
  return first.length > 40 ? `${first.slice(0, 38)}…` : first
}

function SummaryCard({
  data,
  className,
}: {
  data: FinalOverview
  className?: string
}) {
  const subtitle =
    data.ready > 0
      ? `${data.ready} presensi lengkap siap diverifikasi`
      : data.final === data.total
        ? "Semua presensi bulan ini sudah final"
        : "Semua presensi lengkap sudah diverifikasi"

  return (
    <section
      aria-label="Ringkasan presensi"
      className={cn(
        "gap-ns-m border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal",
        className
      )}
    >
      <div className="gap-ns-s flex flex-col">
        <p className="text-body text-grayscale-text-title font-bold">
          {data.final} dari {data.total} presensi final
        </p>
        <p className="text-caption text-grayscale-text-caption">{subtitle}</p>
      </div>
      <StackedProgressBar
        total={data.total}
        showLegend
        remainderLabel="Belum dikumpulkan"
        /* Legenda hanya untuk status yang ada isinya (Final selalu tampil) */
        segments={(
          [
            { label: "Final", value: data.final, tone: "success" },
            { label: "Siap diverifikasi", value: data.ready, tone: "primary" },
            { label: "Menunggu wali", value: data.waiting, tone: "warning" },
            { label: "Keberatan", value: data.disputed, tone: "error" },
          ] as const
        ).filter((s) => s.label === "Final" || s.value > 0)}
      />
    </section>
  )
}

export { VerifikasiPresensi }
