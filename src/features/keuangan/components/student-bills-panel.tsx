import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { UserIcon } from "lucide-react"
import { Link } from "react-router"

import {
  Button,
  DataState,
  FilterPill,
  ListItem,
  StackedProgressBar,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import { monthKey, studentBillsQuery } from "@/features/keuangan/api"
import type { StudentBillList, StudentBillRow } from "@/types/keuangan"

import { formatRupiah, formatRupiahCompact } from "@/lib/format/currency"
import { formatDayMonth } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * P8 · Tagihan siswa · Figma "Laporan Keuangan / Tagihan siswa".
 *
 * Pil periode → ringkasan (terbayar dari total, sisa, bar Lunas/Sebagian/
 * Belum bayar) → Belum bayar · N → Dibayar sebagian · N → "Lihat N tagihan
 * lunas". Dipakai layar Tagihan Siswa (P8) dan tab Tagihan Siswa di Keuangan.
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const PREVIEW = 3

function StudentBillsPanel({
  month,
  onMonthChange,
  className,
}: {
  month?: Date
  onMonthChange: (key: string) => void
  className?: string
}) {
  const query = useQuery({
    ...studentBillsQuery(month),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat tagihan siswa…" />
  }
  if (query.isError || !data) {
    return (
      <DataState
        state="error"
        title="Tagihan siswa gagal dimuat"
        description="Periksa koneksi Anda, lalu coba lagi."
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }

  const count = data.unpaid.length + data.partial.length + data.paidOff.length

  return (
    <div
      aria-busy={query.isPlaceholderData}
      className={cn(
        "gap-ns-2xl flex flex-col transition-opacity",
        query.isPlaceholderData && "opacity-60",
        className
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
        onValueChange={onMonthChange}
      />

      {count === 0 ? (
        <DataState
          state="empty"
          title="Belum ada tagihan"
          description={`Tagihan ${monthLabel(data.month)} akan muncul setelah periode berjalan.`}
        />
      ) : (
        <BillList data={data} />
      )}
    </div>
  )
}

function BillList({ data }: { data: StudentBillList }) {
  const [showPaid, setShowPaid] = React.useState(false)
  const open = data.unpaid.length + data.partial.length
  const paidAmount = (rows: StudentBillRow[]) =>
    rows.reduce((sum, r) => sum + r.total - r.remaining, 0)

  return (
    <>
      <section
        aria-label="Ringkasan tagihan"
        className="gap-ns-m border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal"
      >
        <div className="gap-ns-2xs flex flex-col">
          <p className="text-body text-grayscale-text-title font-bold">
            {formatRupiahCompact(data.paid)} dari{" "}
            {formatRupiahCompact(data.total)} terbayar
          </p>
          <p className="text-caption text-grayscale-text-caption">
            {open > 0
              ? `Sisa ${formatRupiahCompact(data.remaining)} dari ${open} tagihan`
              : "Semua tagihan sudah lunas"}
          </p>
        </div>
        <StackedProgressBar
          total={data.total}
          segments={[
            { label: "Lunas", value: paidAmount(data.paidOff), tone: "success" },
            { label: "Sebagian", value: paidAmount(data.partial), tone: "warning" },
          ]}
        />
        <ul className="gap-x-ns-l gap-y-ns-s text-caption text-grayscale-text-body flex flex-wrap">
          <li className="gap-ns-xs inline-flex items-center">
            <span aria-hidden="true" className="bg-success size-2 rounded-full" />
            Lunas · {data.paidOff.length}
          </li>
          <li className="gap-ns-xs inline-flex items-center">
            <span aria-hidden="true" className="bg-warning size-2 rounded-full" />
            Sebagian · {data.partial.length}
          </li>
          <li className="gap-ns-xs inline-flex items-center">
            <span
              aria-hidden="true"
              className="bg-grayscale-surface-disabled ring-grayscale-border-default size-2 rounded-full ring-1 ring-inset"
            />
            Belum bayar · {data.unpaid.length}
          </li>
        </ul>
      </section>

      {data.unpaid.length > 0 && (
        <BillSection
          title={`Belum bayar · ${data.unpaid.length}`}
          items={data.unpaid}
          describe={(r) =>
            `${r.sessions} sesi · jatuh tempo ${formatDayMonth(r.dueDate)}`
          }
          amount={(r) => r.remaining}
        />
      )}

      {data.partial.length > 0 && (
        <BillSection
          title={`Dibayar sebagian · ${data.partial.length}`}
          items={data.partial}
          describe={(r) =>
            `Sisa ${formatRupiah(r.remaining)} dari ${formatRupiah(r.total)}`
          }
          amount={(r) => r.remaining}
        />
      )}

      {data.paidOff.length > 0 &&
        (showPaid ? (
          <BillSection
            title={`Lunas · ${data.paidOff.length}`}
            items={data.paidOff}
            describe={(r) => `${r.sessions} sesi · lunas`}
            amount={(r) => r.total}
            action={
              <Button
                variant="tertiary"
                size="sm"
                className="-my-ns-s -mr-ns-l"
                aria-expanded
                onClick={() => setShowPaid(false)}
              >
                Sembunyikan
              </Button>
            }
            showAll
          />
        ) : (
          <Button
            variant="tertiary"
            size="sm"
            className="-mt-ns-s w-fit"
            aria-expanded={false}
            onClick={() => setShowPaid(true)}
          >
            Lihat {data.paidOff.length} tagihan lunas
          </Button>
        ))}
    </>
  )
}

function BillSection({
  title,
  items,
  describe,
  amount,
  action,
  showAll: forceAll,
}: {
  title: string
  items: StudentBillRow[]
  describe: (row: StudentBillRow) => string
  amount: (row: StudentBillRow) => number
  action?: React.ReactNode
  showAll?: boolean
}) {
  const [expanded, setExpanded] = React.useState(false)
  const showAll = forceAll || expanded
  const visible = showAll ? items : items.slice(0, PREVIEW)

  return (
    <section className="gap-ns-m flex flex-col">
      <div className="gap-ns-s flex items-center justify-between">
        <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
          {title}
        </h2>
        {action ??
          (items.length > PREVIEW && (
            <Button
              variant="tertiary"
              size="sm"
              className="-my-ns-s -mr-ns-l"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "Ringkas" : "Lihat semua"}
            </Button>
          ))}
      </div>
      <DashboardList>
        {visible.map((row) => (
          <ListItem
            key={row.id}
            icon={<UserIcon />}
            title={row.studentName}
            description={describe(row)}
            trailingText={formatRupiah(amount(row))}
            chevron
            render={<Link to={`/pengelola/laporan-keuangan/tagihan/${row.id}`} />}
          />
        ))}
      </DashboardList>
    </section>
  )
}

export { StudentBillsPanel }
