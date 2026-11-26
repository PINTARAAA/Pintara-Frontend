import { useQuery } from "@tanstack/react-query"
import { BellIcon, ChevronRightIcon } from "lucide-react"
import { Link } from "react-router"

import {
  TabScreen,
  DataState,
  Skeleton,
  StackedProgressBar,
} from "@/components"
import { pengelolaDashboardQuery } from "@/features/dashboard/api"
import {
  DashboardSkeleton,
  DashboardSection,
  HeroCard,
  HeroCardRow,
  NotificationButton,
  TaskList,
} from "@/features/dashboard/components"

import { formatRupiahCompact } from "@/lib/format/currency"
import { formatDayMonth, formatGreeting, formatWeekdayDate } from "@/lib/format/date"
import { usePengelolaUnreadNotifications } from "@/features/notifikasi/api"

function PengelolaDashboard() {
  const query = useQuery(pengelolaDashboardQuery())
  const unread = usePengelolaUnreadNotifications()
  const data = query.data

  return (
    <TabScreen
      subtitle={formatGreeting()}
      title={data?.admin.name ?? <Skeleton className="h-6 w-48" />}
      action={
        <NotificationButton to="/pengelola/notifikasi" unread={unread} />
      }
    >
      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Beranda gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
          <HeroCard
            className="lg:order-1"
            to="/pengelola/les"
            label={`Hari ini ${data.today.sessions} sesi les, lihat detail`}
            eyebrow={`Hari ini · ${formatWeekdayDate(data.today.date)}`}
            title={`${data.today.sessions} sesi les`}
            subtitle={`${data.today.tutorsOnDuty} tutor bertugas · ${data.today.attendanceSubmitted} sesi sudah dipresensi`}
            footer={
              <HeroCardRow
                leading={
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-grayscale-surface-default text-primary-text-primary">
                    <BellIcon aria-hidden="true" className="size-5" />
                  </span>
                }
                title={
                  data.today.missingYesterday > 0
                    ? `${data.today.missingYesterday} presensi kemarin belum masuk`
                    : "Semua presensi kemarin sudah masuk"
                }
                description={
                  data.today.missingYesterday > 0
                    ? "Pengingat otomatis terkirim ke tutor pukul 08.00"
                    : undefined
                }
              />
            }
          />

          <DashboardSection title="Perlu tindakan" className="lg:order-3 lg:col-span-2">
            <TaskList
              tasks={data.tasks}
              columns={2}
              emptyDescription="Tidak ada antrean verifikasi atau peninjauan."
            />
          </DashboardSection>

          <DashboardSection
            title={`Tagihan ${data.billing.month}`}
            action={{ label: "Lihat keuangan", to: "/pengelola/keuangan" }}
            className="lg:order-2"
          >
            <Link
              to="/pengelola/keuangan"
              className="group flex flex-col gap-ns-l rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l outline-none transition-colors hover:border-grayscale-border-darker focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
            >
              <div className="flex items-start gap-ns-s">
                <div className="flex flex-1 flex-col gap-ns-2xs leading-normal">
                  <p className="text-body font-bold text-grayscale-text-title">
                    {formatRupiahCompact(data.billing.paidAmount)} dari{" "}
                    {formatRupiahCompact(data.billing.totalAmount)} terbayar
                  </p>
                  <p className="text-caption text-grayscale-text-caption">
                    {data.billing.invoices} tagihan siswa · jatuh tempo{" "}
                    {formatDayMonth(data.billing.dueDate)}
                  </p>
                </div>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-grayscale-text-body"
                />
              </div>
              <StackedProgressBar
                total={data.billing.invoices}
                segments={[
                  { label: "Lunas", value: data.billing.lunas, tone: "success" },
                  { label: "Sebagian", value: data.billing.sebagian, tone: "warning" },
                ]}
                remainderLabel="Belum bayar"
                showLegend
              />
            </Link>
          </DashboardSection>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { PengelolaDashboard }
