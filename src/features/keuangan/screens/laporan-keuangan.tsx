import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  CreditCardIcon,
  DownloadIcon,
  ReceiptIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"

import {
  DetailScreen,
  Button,
  DataState,
  FilterPill,
  ListItem,
  TopAppBarButton,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import { monthKey, financeSummaryQuery } from "@/features/keuangan/api"
import type { FinanceSummary } from "@/types/keuangan"

import { UnduhLaporanSheet } from "@/features/keuangan/components"
import { parseMonth, formatRupiah, formatRupiahCompact } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * P8 · Laporan Keuangan · Figma "Laporan Keuangan / Ringkasan" dan "Kosong".
 *
 * Pil periode → kartu Bagian lembaga (estimasi) → Perhitungan (tagihan −
 * honor) → Telusuri rincian (Tagihan siswa, Pembayaran siswa, Honor tutor,
 * Pembayaran honor). Bilah aksi & ikon kanan atas membuka sheet Unduh
 * laporan. Periode tanpa data → kartu "Belum ada data keuangan".
 * Bulan disimpan di ?bulan=YYYY-MM.
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })

function LaporanKeuangan() {
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get("bulan"))
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const query = useQuery({
    ...financeSummaryQuery(month),
    placeholderData: keepPreviousData,
  })
  const data = query.data
  const hasData = data?.state === "ada"

  const setMonth = (key: string) => {
    const next = new URLSearchParams(params)
    if (key === monthKey(new Date())) next.delete("bulan")
    else next.set("bulan", key)
    setParams(next, { replace: true })
  }

  return (
    <DetailScreen
      title="Laporan Keuangan"
      action={
        hasData && (
          <TopAppBarButton
            label="Unduh laporan keuangan"
            onClick={() => setSheetOpen(true)}
          >
            <DownloadIcon />
          </TopAppBarButton>
        )
      }
      footer={
        hasData && (
          <Button onClick={() => setSheetOpen(true)}>Unduh Laporan</Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat laporan keuangan…" />
      ) : query.isError || !data ? (
        <DataState
          state="error"
          title="Laporan keuangan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "gap-ns-2xl flex flex-col transition-opacity",
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
            onValueChange={setMonth}
          />

          {data.state === "kosong" ? (
            <DataState
              state="empty"
              title="Belum ada data keuangan"
              description={`Tagihan dan rekap honor ${monthLabel(data.month)} akan muncul setelah periode berjalan.`}
            />
          ) : (
            <Summary data={data} />
          )}
        </div>
      )}

      {hasData && (
        <UnduhLaporanSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          months={data.months}
          month={data.month}
        />
      )}
    </DetailScreen>
  )
}

function Summary({ data }: { data: Extract<FinanceSummary, { state: "ada" }> }) {
  const bulan = monthKey(data.month)
  const query = bulan === monthKey(new Date()) ? "" : `?bulan=${bulan}`

  return (
    <>
      <section
        aria-label="Bagian lembaga"
        className="gap-ns-2xs border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal"
      >
        <p className="text-caption text-grayscale-text-caption">
          Bagian lembaga (estimasi)
        </p>
        <p className="text-h3 text-grayscale-text-title font-bold">
          {formatRupiah(data.institutionShare)}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          Tagihan siswa dikurangi honor tutor pada periode ini
        </p>
      </section>

      <section className="gap-ns-m flex flex-col">
        <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
          Perhitungan
        </h2>
        <div className="gap-ns-m border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal">
          <dl className="gap-ns-m flex flex-col">
            <div className="gap-ns-m flex items-center justify-between">
              <dt className="text-subtitle text-grayscale-text-body">
                Total tagihan siswa
              </dt>
              <dd className="text-subtitle text-grayscale-text-title font-bold">
                {formatRupiah(data.bills.total)}
              </dd>
            </div>
            <div className="gap-ns-m flex items-center justify-between">
              <dt className="text-subtitle text-grayscale-text-body">
                Total honor tutor
                {!data.honor.calculated && (
                  <span className="text-caption text-grayscale-text-caption">
                    {" "}
                    · estimasi
                  </span>
                )}
              </dt>
              <dd className="text-subtitle text-error font-bold">
                −{formatRupiah(data.honor.total)}
              </dd>
            </div>
          </dl>
          <div aria-hidden="true" className="bg-grayscale-border-disabled h-px" />
          <div className="gap-ns-m flex items-center justify-between">
            <span className="text-subtitle text-grayscale-text-title font-bold">
              Bagian lembaga
            </span>
            <span className="text-body text-grayscale-text-title font-bold">
              {formatRupiah(data.institutionShare)}
            </span>
          </div>
        </div>
      </section>

      <section className="gap-ns-m flex flex-col">
        <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
          Telusuri rincian
        </h2>
        <DashboardList>
          <ListItem
            icon={<ReceiptIcon />}
            title="Tagihan siswa"
            description={`${data.bills.count} tagihan · ${data.bills.lunas} lunas · ${data.bills.sebagian} sebagian · ${data.bills.belum} belum`}
            trailingText={formatRupiahCompact(data.bills.total)}
            chevron
            render={<Link to={`/pengelola/laporan-keuangan/tagihan${query}`} />}
          />
          <ListItem
            icon={<CreditCardIcon />}
            title="Pembayaran siswa"
            description={`Diterima · ${data.payments.transactions} transaksi · ${data.payments.failed} gagal`}
            trailingText={formatRupiahCompact(data.payments.received)}
            chevron
            render={<Link to={`/pengelola/laporan-keuangan/tagihan${query}`} />}
          />
          <ListItem
            icon={<UsersIcon />}
            title="Honor tutor"
            description={`${data.honor.sessions} sesi terverifikasi · ${data.honor.tutors} tutor`}
            trailingText={formatRupiahCompact(data.honor.total)}
            chevron
            render={<Link to={`/pengelola/keuangan${query}`} />}
          />
          <ListItem
            icon={<WalletIcon />}
            title="Pembayaran honor"
            description={`Dibayar · ${data.honorPaid.tutors} dari ${data.honor.tutors} tutor`}
            trailingText={formatRupiahCompact(data.honorPaid.amount)}
            chevron
            render={<Link to={`/pengelola/keuangan${query}`} />}
          />
        </DashboardList>
      </section>
    </>
  )
}

export { LaporanKeuangan }
