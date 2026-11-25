import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { format, subMonths } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useSearchParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/ui/data-state"
import { FilterChip } from "@/components/ui/filter-chip"
import { FilterPill } from "@/components/ui/filter-pill"
import { ListItem } from "@/components/ui/list-item"
import { toast } from "@/components/ui/toast-api"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import { CHANNEL_LABEL } from "@/features/pengaturan-notifikasi/api/pengaturan-notifikasi"
import {
  KIND_LABEL,
  notificationLogsQuery,
  PERIODS,
  resendAllFailed,
  type LogFilter,
  type LogStatus,
  type NotificationKind,
  type NotificationLog,
  type Period,
} from "@/features/riwayat-notifikasi/api/riwayat-notifikasi"
import { formatDayMonth } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * P13 · Riwayat Notifikasi · Figma "Riwayat Notifikasi / Daftar",
 * "Terkirim ulang" dan "Tidak ditemukan".
 *
 * Pil Status · Jenis · Periode (filter aktif = chip ×) → Gagal terkirim · N
 * (Kirim ulang semua; ketuk → detail) → Terkirim. Disimpan di
 * ?status=…&jenis=…&periode=….
 */
const KINDS = Object.keys(KIND_LABEL) as NotificationKind[]
const time = (d: Date) => format(d, "HH.mm")

function periodLabel(period: Period, now = new Date()) {
  if (period === "hari-ini") return format(now, "d MMM yyyy", { locale: localeId })
  if (period === "7-hari") return "7 hari terakhir"
  return format(period === "bulan-ini" ? now : subMonths(now, 1), "MMMM yyyy", {
    locale: localeId,
  })
}

const names = (log: NotificationLog) => log.recipients.map((r) => r.name).join(", ")

function RiwayatNotifikasi() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const statusParam = params.get("status")
  const kindParam = params.get("jenis") as NotificationKind | null
  const periodParam = params.get("periode") as Period | null
  const filter: LogFilter = {
    status: statusParam === "gagal" || statusParam === "terkirim" ? statusParam : undefined,
    kind: kindParam && KINDS.includes(kindParam) ? kindParam : undefined,
    period: periodParam && PERIODS.includes(periodParam) ? periodParam : "hari-ini",
  }
  const query = useQuery({
    ...notificationLogsQuery(filter),
    placeholderData: keepPreviousData,
  })

  const update = (key: "status" | "jenis" | "periode", value: string | null) => {
    const next = new URLSearchParams(params)
    if (value && !(key === "periode" && value === "hari-ini")) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const reset = () => setParams(new URLSearchParams(), { replace: true })
  const filtered = !!(filter.status || filter.kind || filter.period !== "hari-ini")

  const resendAll = useMutation({
    mutationFn: () => resendAllFailed(filter),
    networkMode: "always",
    onSuccess: ({ sent, stillFailed }) => {
      void queryClient.invalidateQueries({ queryKey: ["riwayat-notifikasi"] })
      if (sent.length === 0) {
        toast.error("Notifikasi masih gagal terkirim", {
          description: "Kontak penerima tidak valid. Perbarui kontaknya lalu kirim ulang.",
        })
      } else {
        toast.success(
          sent.length === 1 ? "Notifikasi terkirim ulang" : `${sent.length} notifikasi terkirim ulang`,
          {
            description: [
              `Status ke ${sent.join(", ")} diperbarui menjadi Terkirim.`,
              ...(stillFailed > 0 ? [`${stillFailed} masih gagal karena kontak tidak valid.`] : []),
            ].join(" "),
          }
        )
      }
    },
    onError: () =>
      toast.error("Kirim ulang gagal", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  const data = query.data
  const empty = data && data.failed.length === 0 && data.sent.length === 0

  return (
    <DetailScreen
      title="Riwayat Notifikasi"
      subheader={
        <div className="gap-ns-s -mx-(--gutter) px-(--gutter) flex overflow-x-auto [scrollbar-width:none]">
          {filter.status ? (
            <FilterChip
              label={filter.status === "gagal" ? "Gagal" : "Terkirim"}
              onClear={() => update("status", null)}
            />
          ) : (
            <FilterPill
              label="Status"
              menuLabel="Pilih status"
              triggerLabel="Semua status"
              value=""
              options={[
                { value: "", label: "Semua status" },
                { value: "gagal", label: "Gagal" },
                { value: "terkirim", label: "Terkirim" },
              ]}
              onValueChange={(v) => update("status", (v as LogStatus) || null)}
            />
          )}
          {filter.kind ? (
            <FilterChip label={KIND_LABEL[filter.kind]} onClear={() => update("jenis", null)} />
          ) : (
            <FilterPill
              label="Jenis"
              menuLabel="Pilih jenis notifikasi"
              triggerLabel="Semua jenis"
              value=""
              options={[
                { value: "", label: "Semua jenis" },
                ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] })),
              ]}
              onValueChange={(v) => update("jenis", v || null)}
            />
          )}
          <FilterPill
            label="Periode"
            menuLabel="Pilih periode"
            value={filter.period}
            options={PERIODS.map((p) => ({
              value: p,
              label: p === "hari-ini" ? `Hari ini · ${periodLabel(p)}` : periodLabel(p),
            }))}
            triggerLabel={periodLabel(filter.period)}
            onValueChange={(v) => update("periode", v)}
          />
        </div>
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat riwayat notifikasi…" />
      ) : query.isError || !data ? (
        <DataState
          state="error"
          title="Riwayat notifikasi gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : empty ? (
        <div className="gap-ns-l flex flex-col items-center">
          <DataState
            state="empty"
            className="w-full"
            title={filtered ? "Data log tidak ditemukan" : "Belum ada notifikasi"}
            description={
              filtered
                ? `Tidak ada notifikasi${filter.kind ? ` ${KIND_LABEL[filter.kind].toLowerCase()}` : ""}${filter.status ? ` yang ${filter.status === "gagal" ? "gagal" : "terkirim"}` : ""} ${filter.period === "7-hari" ? "dalam 7 hari terakhir" : `di ${periodLabel(filter.period)}`}.`
                : "Notifikasi yang dikirim hari ini akan muncul di sini."
            }
          />
          {filtered && (
            <Button variant="secondary" size="sm" onClick={reset}>
              Reset filter
            </Button>
          )}
        </div>
      ) : (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "gap-ns-2xl flex flex-col transition-opacity lg:max-w-3xl",
            query.isPlaceholderData && "opacity-60"
          )}
        >
          {data.failed.length > 0 && (
            <section className="gap-ns-m flex flex-col">
              <div className="gap-ns-s flex items-center justify-between">
                <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
                  Gagal terkirim · {data.failed.length}
                </h2>
                <Button
                  variant="tertiary"
                  size="sm"
                  className="-my-ns-s -mr-ns-l"
                  disabled={resendAll.isPending}
                  onClick={() => resendAll.mutate()}
                >
                  {resendAll.isPending ? "Mengirim…" : "Kirim ulang semua"}
                </Button>
              </div>
              <DashboardList>
                {data.failed.map((l) => (
                  <ListItem
                    key={l.id}
                    title={KIND_LABEL[l.kind]}
                    description={[
                      `Ke ${names(l)}`,
                      CHANNEL_LABEL[l.channel],
                      ...(filter.period === "hari-ini" ? [] : [formatDayMonth(l.sentAt)]),
                      time(l.sentAt),
                      l.reasonShort ?? l.reason?.toLowerCase(),
                    ].join(" · ")}
                    chevron
                    render={<Link to={`/pengelola/riwayat-notifikasi/${l.id}`} />}
                  />
                ))}
              </DashboardList>
            </section>
          )}

          {data.sent.length > 0 && (
            <section className="gap-ns-m flex flex-col">
              <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
                {filter.period === "hari-ini" ? "Terkirim hari ini" : `Terkirim · ${data.sent.length}`}
              </h2>
              <DashboardList>
                {data.sent.map((l) => (
                  <ListItem
                    key={l.id}
                    title={KIND_LABEL[l.kind]}
                    description={[
                      `Ke ${names(l)}`,
                      ...(filter.period === "hari-ini" ? [] : [formatDayMonth(l.resentAt ?? l.sentAt)]),
                      l.resentAt ? `dikirim ulang ${time(l.resentAt)}` : time(l.sentAt),
                    ].join(" · ")}
                    render={<Link to={`/pengelola/riwayat-notifikasi/${l.id}`} />}
                  />
                ))}
              </DashboardList>
            </section>
          )}
        </div>
      )}
    </DetailScreen>
  )
}

export { RiwayatNotifikasi }
