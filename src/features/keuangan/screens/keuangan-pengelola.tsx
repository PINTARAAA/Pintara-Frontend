import * as React from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { DownloadIcon, UserIcon } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"

import {
  TabScreen,
  AlertBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  FilterPill,
  ListItem,
  StackedProgressBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
  TopAppBarButton,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import {
  calculateHonor,
  honorRecapQuery,
  METHOD_LABEL,
  monthKey,
  availableMonths,
} from "@/features/keuangan/api"
import type { HonorRecap, TutorHonor } from "@/types/keuangan"

import {
  StudentBillsPanel,
  UnduhLaporanSheet,
} from "@/features/keuangan/components"

import {
  parseMonth,
  formatRupiah,
  formatRupiahCompact,
  formatDayMonth,
} from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * Keuangan (tab pengelola) · tab Honor Tutor · Tagihan Siswa.
 *
 * P7 · Rekap & Pembayaran Honor · Figma "Honor / Belum dihitung" dan
 * "Honor / Rekap": pil periode → [belum dihitung: info presensi final,
 * peringatan tarif, cara perhitungan, Hitung Rekap Honor] atau [ringkasan
 * total + bar dibayar/belum → Belum dibayar → Sudah dibayar].
 * Tab, bulan disimpan di ?tab=tagihan&bulan=YYYY-MM. Tab Tagihan Siswa dan
 * tombol unduh laporan memakai komponen P8 · Laporan Keuangan.
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const monthName = (d: Date) => format(d, "MMMM", { locale: localeId })
const stamp = (d: Date) => format(d, "d MMM, HH.mm", { locale: localeId })
const PREVIEW = 3

function KeuanganPengelola() {
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const tab = params.get("tab") === "tagihan" ? "tagihan" : "honor"
  const month = parseMonth(params.get("bulan"))

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setParam("tab", v === "tagihan" ? "tagihan" : null)}
      className="contents"
    >
      <TabScreen
        title="Keuangan"
        action={
          <TopAppBarButton
            label="Unduh laporan keuangan"
            onClick={() => setSheetOpen(true)}
          >
            <DownloadIcon />
          </TopAppBarButton>
        }
        subheader={
          <TabsList className="border-grayscale-border-default w-full border-b *:-mb-px">
            <TabsTrigger value="honor">Honor Tutor</TabsTrigger>
            <TabsTrigger value="tagihan">Tagihan Siswa</TabsTrigger>
          </TabsList>
        }
      >
        <TabsContent value="honor" className="flex flex-col">
          <HonorPanel
            month={month}
            onMonthChange={(key, isCurrent) =>
              setParam("bulan", isCurrent ? null : key)
            }
          />
        </TabsContent>
        <TabsContent value="tagihan" className="flex flex-col">
          <StudentBillsPanel
            month={month}
            className="lg:max-w-3xl"
            onMonthChange={(key) =>
              setParam("bulan", key === monthKey(new Date()) ? null : key)
            }
          />
        </TabsContent>
      </TabScreen>
      <UnduhLaporanSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        months={availableMonths()}
        month={month ?? new Date()}
      />
    </Tabs>
  )
}

function HonorPanel({
  month,
  onMonthChange,
}: {
  month?: Date
  onMonthChange: (key: string, isCurrent: boolean) => void
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    ...honorRecapQuery(month),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  const calculate = useMutation({
    mutationFn: () => calculateHonor(data?.month ?? new Date()),
    networkMode: "always",
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["honor"] })
      toast.success("Rekap honor dihitung", {
        description: `${result.tutors} tutor · total ${formatRupiah(result.total)}.`,
      })
    },
    onError: () =>
      toast.error("Rekap gagal dihitung", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat rekap honor…" />
  }
  if (query.isError || !data) {
    return (
      <DataState
        state="error"
        title="Rekap honor gagal dimuat"
        description="Periksa koneksi Anda, lalu coba lagi."
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }

  return (
    <div
      aria-busy={query.isPlaceholderData}
      className={cn(
        "gap-ns-2xl flex flex-col transition-opacity lg:max-w-3xl",
        query.isPlaceholderData && "opacity-60"
      )}
    >
      <FilterPill
        label="Periode"
        menuLabel="Pilih periode"
        value={monthKey(data.month)}
        options={data.months.map((m) => ({
          value: monthKey(m),
          label: monthLabel(m),
        }))}
        onValueChange={(v) => onMonthChange(v, v === monthKey(data.months[0]))}
      />

      {data.state === "belum_dihitung" ? (
        <NotCalculated
          data={data}
          calculating={calculate.isPending}
          onCalculate={() => calculate.mutate()}
        />
      ) : (
        <Recap data={data} />
      )}
    </div>
  )
}

/* "Honor / Belum dihitung" */
function NotCalculated({
  data,
  calculating,
  onCalculate,
}: {
  data: Extract<HonorRecap, { state: "belum_dihitung" }>
  calculating: boolean
  onCalculate: () => void
}) {
  const navigate = useNavigate()
  return (
    <>
      <AlertBanner
        status="info"
        title={`Rekap honor ${monthName(data.month)} belum dihitung`}
        description={`${data.final} dari ${data.total} presensi sudah final. Presensi yang belum final tidak ikut dihitung.`}
        action={
          data.final < data.total
            ? {
                label: "Verifikasi presensi",
                onClick: () => navigate("/pengelola/presensi"),
              }
            : undefined
        }
      />

      {data.tutorsWithoutRate.map((name) => (
        <AlertBanner
          key={name}
          status="warning"
          title={`Tarif honor ${name} belum diatur`}
          description="Tutor ini ditandai dan tidak ikut dihitung sampai tarifnya diatur."
          action={{
            label: "Atur tarif",
            /* SEMENTARA: layar Data Tutor (P9) */
            onClick: () => navigate("/pengelola/tutor"),
          }}
        />
      ))}

      <Card size="compact">
        <CardHeader>
          <CardTitle>Cara perhitungan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-caption text-grayscale-text-caption leading-normal">
            Total honor tutor = Σ (sesi terverifikasi × tarif per sesi)
          </p>
        </CardContent>
      </Card>

      <Button onClick={onCalculate} disabled={calculating || data.final === 0}>
        {calculating ? "Menghitung…" : "Hitung Rekap Honor"}
      </Button>
    </>
  )
}

/* "Honor / Rekap" */
function Recap({ data }: { data: Extract<HonorRecap, { state: "dihitung" }> }) {
  const [showAllUnpaid, setShowAllUnpaid] = React.useState(false)
  const [showAllPaid, setShowAllPaid] = React.useState(false)
  const tutors = data.unpaidHonors.length + data.paidHonors.length
  const monthParam = monthKey(data.month)

  return (
    <>
      <section
        aria-label="Ringkasan honor"
        className="gap-ns-m border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal"
      >
        <div className="gap-ns-2xs flex flex-col">
          <p className="text-caption text-grayscale-text-caption">
            Total honor {monthName(data.month)}
          </p>
          <p className="text-h3 text-grayscale-text-title font-bold">
            {formatRupiah(data.total)}
          </p>
          <p className="text-caption text-grayscale-text-caption">
            {data.sessions} sesi · {tutors} tutor · dihitung{" "}
            {stamp(data.calculatedAt)}
          </p>
        </div>
        <StackedProgressBar
          total={data.total}
          segments={[
            { label: "Dibayar", value: data.paid.amount, tone: "success" },
          ]}
        />
        <ul className="gap-x-ns-l gap-y-ns-s text-caption text-grayscale-text-body flex flex-wrap">
          <li className="gap-ns-xs inline-flex items-center">
            <span
              aria-hidden="true"
              className="bg-success size-2 rounded-full"
            />
            Dibayar {formatRupiahCompact(data.paid.amount)} · {data.paid.tutors}{" "}
            tutor
          </li>
          <li className="gap-ns-xs inline-flex items-center">
            <span
              aria-hidden="true"
              className="bg-grayscale-surface-disabled ring-grayscale-border-default size-2 rounded-full ring-1 ring-inset"
            />
            Belum {formatRupiahCompact(data.unpaid.amount)} ·{" "}
            {data.unpaid.tutors} tutor
          </li>
        </ul>
      </section>

      {data.skipped.length > 0 && (
        <AlertBanner
          status="warning"
          title={`${data.skipped.length} tutor belum dihitung`}
          description={`Tarif ${data.skipped.join(", ")} belum diatur. Hitung ulang setelah tarif diatur.`}
        />
      )}

      {data.unpaidHonors.length > 0 && (
        <HonorSection
          title={`Belum dibayar · ${data.unpaidHonors.length}`}
          showAll={showAllUnpaid}
          onToggle={() => setShowAllUnpaid((v) => !v)}
          items={data.unpaidHonors}
          render={(h) => (
            <ListItem
              key={h.tutorId}
              icon={<UserIcon />}
              title={h.name}
              description={`${h.sessions} sesi · ${h.payment ? "dibayar sebagian" : METHOD_LABEL[h.method]}`}
              trailingText={formatRupiah(h.total - (h.payment?.amount ?? 0))}
              chevron
              render={
                <Link
                  to={`/pengelola/keuangan/honor/${monthParam}/${h.tutorId}`}
                />
              }
            />
          )}
        />
      )}

      {data.paidHonors.length > 0 && (
        <HonorSection
          title={`Sudah dibayar · ${data.paidHonors.length}`}
          showAll={showAllPaid}
          onToggle={() => setShowAllPaid((v) => !v)}
          items={data.paidHonors}
          render={(h) => (
            <ListItem
              key={h.tutorId}
              icon={<UserIcon />}
              title={h.name}
              description={`${h.sessions} sesi · ${h.payment ? METHOD_LABEL[h.payment.method] : ""} · ${h.payment ? formatDayMonth(h.payment.paidAt) : ""}`}
              trailingText={formatRupiah(h.total)}
              render={
                <Link
                  to={`/pengelola/keuangan/honor/${monthParam}/${h.tutorId}`}
                />
              }
            />
          )}
        />
      )}
    </>
  )
}

function HonorSection({
  title,
  items,
  showAll,
  onToggle,
  render,
}: {
  title: string
  items: TutorHonor[]
  showAll: boolean
  onToggle: () => void
  render: (h: TutorHonor) => React.ReactNode
}) {
  const visible = showAll ? items : items.slice(0, PREVIEW)
  return (
    <section className="gap-ns-m flex flex-col">
      <div className="gap-ns-s flex items-center justify-between">
        <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
          {title}
        </h2>
        {items.length > PREVIEW && (
          <Button
            variant="tertiary"
            size="sm"
            className="-my-ns-s -mr-ns-l"
            onClick={onToggle}
            aria-expanded={showAll}
          >
            {showAll ? "Ringkas" : "Lihat semua"}
          </Button>
        )}
      </div>
      <DashboardList>{visible.map(render)}</DashboardList>
    </section>
  )
}

export { KeuanganPengelola }
