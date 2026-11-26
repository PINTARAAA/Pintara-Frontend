import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  CalendarIcon,
  CreditCardIcon,
  ReceiptIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"

import {
  TabScreen,
  StatusBadge,
  Button,
  DataState,
  ListItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components"
import {
  DashboardList,
  DashboardSection,
  NotificationButton,
} from "@/features/dashboard/components"

import { useUnreadNotifications } from "@/features/notifikasi/api"
import {
  billsQuery,
  daysUntilDue,
  paymentsQuery,
  remainingOf,
  statusOf,
} from "@/features/tagihan/api"
import { formatDue, formatMonth, formatPeriod } from "@/features/tagihan/lib"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/styles"
import type {
  Bill,
  BillsOverview,
  Payment,
  PaymentStatus,
} from "@/types/tagihan"

/*
 * W6 · Tagihan (tab) · Figma "Tagihan / Daftar", "Tagihan / Kosong" dan
 * "Tagihan / Riwayat pembayaran".
 *
 * Tab "Tagihan": kartu "Segera dibayar" (tagihan paling mendesak: sisa,
 * peringatan jatuh tempo, tombol bayar) · "Tagihan lain" · catatan.
 * Tab "Riwayat Pembayaran": transaksi dikelompokkan per bulan.
 * Tab aktif disimpan di ?tab=riwayat.
 */
type TabValue = "tagihan" | "riwayat"

function Tagihan() {
  const unreadNotifications = useUnreadNotifications()
  const [params, setParams] = useSearchParams()
  const tab: TabValue = params.get("tab") === "riwayat" ? "riwayat" : "tagihan"
  const bills = useQuery(billsQuery())

  return (
    <Tabs
      value={tab}
      onValueChange={(value) =>
        setParams(value === "riwayat" ? { tab: "riwayat" } : {}, {
          replace: true,
        })
      }
      className="contents"
    >
      <TabScreen
        title="Tagihan"
        action={
          <NotificationButton
            to="/wali/notifikasi"
            unread={unreadNotifications}
          />
        }
        subheader={
          <TabsList className="w-full border-b border-grayscale-border-default *:-mb-px">
            <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat Pembayaran</TabsTrigger>
          </TabsList>
        }
      >
        <TabsContent value="tagihan" className="flex flex-col">
          <BillsPanel query={bills} />
        </TabsContent>
        <TabsContent value="riwayat" className="flex flex-col">
          <PaymentsPanel />
        </TabsContent>
      </TabScreen>
    </Tabs>
  )
}

/* ---------- Tab Tagihan ---------- */

function BillsPanel({ query }: { query: UseQueryResult<BillsOverview> }) {
  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat tagihan…" />
  }
  if (query.isError) {
    return (
      <DataState
        state="error"
        title="Tagihan gagal dimuat"
        description="Periksa koneksi Anda, lalu coba lagi."
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }

  const { priority, others } = query.data
  if (!priority) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <DataState
          state="empty"
          title="Belum ada tagihan"
          description="Tagihan les akan muncul di sini setiap awal periode."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-ns-2xl">
      <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
        <DashboardSection title="Segera dibayar">
          <PriorityBill bill={priority} />
        </DashboardSection>

        {others.length > 0 && (
          <DashboardSection title="Tagihan lain">
            <DashboardList>
              {others.map((bill) => (
                <ListItem
                  key={bill.id}
                  icon={<ReceiptIcon />}
                  title={formatPeriod(bill.period)}
                  description={formatDue(bill, "short")}
                  trailingText={formatRupiah(remainingOf(bill))}
                  chevron
                  render={<Link to={`/wali/tagihan/${bill.id}`} />}
                />
              ))}
            </DashboardList>
          </DashboardSection>
        )}
      </div>

      <p className="text-center text-caption leading-normal text-grayscale-text-caption">
        Tagihan yang sudah lunas tersimpan di Riwayat Pembayaran.
      </p>
    </div>
  )
}

/*
 * Kartu "Priority bill": padding 20, gap 16. Header (periode + badge) ·
 * sisa tagihan H3 · pil jatuh tempo (Secondary/Surface/subtitle bila lewat)
 * · Bayar (Primary) + Lihat rincian (Tertiary small).
 */
function PriorityBill({ bill }: { bill: Bill }) {
  const remaining = remainingOf(bill)
  const overdue = daysUntilDue(bill) < 0

  return (
    <div className="flex flex-col gap-ns-l rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-xl">
      <div className="flex items-center justify-between gap-ns-s">
        <p className="text-subtitle leading-normal font-bold text-grayscale-text-title">
          Tagihan {formatPeriod(bill.period)}
        </p>
        <StatusBadge category="pembayaran" status={statusOf(bill)} />
      </div>

      <div className="flex flex-col gap-ns-2xs leading-normal">
        <p className="text-caption text-grayscale-text-caption">Sisa tagihan</p>
        <p className="text-h3 font-bold text-grayscale-text-title">
          {formatRupiah(remaining)}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {bill.paid > 0
            ? `Sudah dibayar ${formatRupiah(bill.paid)} dari ${formatRupiah(bill.total)}`
            : `Total tagihan ${formatRupiah(bill.total)}`}
        </p>
      </div>

      <p
        className={cn(
          "flex items-center gap-ns-s rounded-full px-ns-m py-ns-s text-caption leading-normal font-bold",
          overdue
            ? "bg-secondary-surface-subtitle text-secondary-text-label"
            : "bg-grayscale-surface-subtitle text-grayscale-text-body"
        )}
      >
        {overdue ? (
          <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <CalendarIcon aria-hidden="true" className="size-4 shrink-0" />
        )}
        {formatDue(bill, "long")}
      </p>

      <div className="flex flex-col items-center gap-ns-2xs">
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link to={`/wali/tagihan/${bill.id}/bayar`} />}
        >
          Bayar {formatRupiah(remaining)}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          nativeButton={false}
          render={<Link to={`/wali/tagihan/${bill.id}`} />}
        >
          Lihat rincian
        </Button>
      </div>
    </div>
  )
}

/* ---------- Tab Riwayat Pembayaran ---------- */

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  berhasil: { label: "Berhasil", className: "text-grayscale-text-caption" },
  kedaluwarsa: { label: "Kedaluwarsa", className: "text-grayscale-text-negative" },
  gagal: { label: "Gagal", className: "text-grayscale-text-negative" },
}

function PaymentsPanel() {
  const query = useQuery(paymentsQuery())

  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat riwayat pembayaran…" />
  }
  if (query.isError) {
    return (
      <DataState
        state="error"
        title="Riwayat gagal dimuat"
        description="Periksa koneksi Anda, lalu coba lagi."
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }
  if (query.data.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <DataState
          state="empty"
          title="Belum ada pembayaran"
          description="Pembayaran yang Anda lakukan akan tersimpan di sini."
        />
      </div>
    )
  }

  /* Kelompokkan per bulan transaksi: "November 2026" */
  const groups = new Map<string, Payment[]>()
  for (const payment of query.data) {
    const key = formatPeriod(payment.createdAt)
    groups.set(key, [...(groups.get(key) ?? []), payment])
  }

  return (
    <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
      {[...groups].map(([month, items]) => (
        <DashboardSection key={month} title={month}>
          <DashboardList>
            {items.map((payment) => {
              const status = PAYMENT_STATUS[payment.status]
              return (
                <ListItem
                  key={payment.id}
                  icon={<CreditCardIcon />}
                  title={formatRupiah(payment.amount)}
                  description={`Tagihan ${formatMonth(payment.billPeriod)} · ${payment.method === "Virtual Account BCA" ? "VA BCA" : payment.method} · ${format(payment.createdAt, "d MMM, HH.mm", { locale: localeId })}`}
                  badge={
                    <span
                      className={cn(
                        "text-subtitle font-bold whitespace-nowrap",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  }
                />
              )
            })}
          </DashboardList>
        </DashboardSection>
      ))}
    </div>
  )
}

export { Tagihan }
