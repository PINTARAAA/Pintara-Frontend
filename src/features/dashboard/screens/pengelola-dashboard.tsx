import { useQuery } from "@tanstack/react-query"
import { BellIcon, ChevronRightIcon, CircleCheckIcon } from "lucide-react"
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
  TaskActionList,
  TaskList,
} from "@/features/dashboard/components"
import type { PengelolaDashboardData } from "@/types/dashboard"

import {
  formatRupiahCompact,
  formatDayMonth,
  formatGreeting,
  formatWeekdayDate,
} from "@/lib/format"
import { cn } from "@/lib/styles"
import { usePengelolaUnreadNotifications } from "@/features/notifikasi/api"

/*
 * Beranda Pengelola LBB · Figma PINTARA → UI Screen → Pengelola → P1 · Beranda
 *
 * Mobile (< lg, frame "Pengelola / Beranda"): kartu "Hari ini", Perlu
 *   tindakan, Tagihan bulan ini — ditumpuk satu kolom.
 * Desktop (≥ lg, frame "Pengelola / Beranda (Desktop)"): halaman putih,
 *   kolom utama berisi Perlu tindakan (tombol aksi langsung) dan Hari ini
 *   (tiga angka + pengingat); kolom samping bergaris kiri berisi ringkasan
 *   tagihan. Kedua versi dirender terpisah agar tampilan mobile tidak berubah.
 */
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
      className={data ? "lg:bg-grayscale-surface-default" : undefined}
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
        <>
          <MobileDashboard data={data} />
          <DesktopDashboard data={data} />
        </>
      ) : null}
    </TabScreen>
  )
}

function MobileDashboard({ data }: { data: PengelolaDashboardData }) {
  return (
    <div className="flex flex-col gap-ns-2xl lg:hidden">
      <HeroCard
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

      <DashboardSection title="Perlu tindakan">
        <TaskList
          tasks={data.tasks}
          emptyDescription="Tidak ada antrean verifikasi atau peninjauan."
        />
      </DashboardSection>

      <DashboardSection
        title={`Tagihan ${data.billing.month}`}
        action={{ label: "Lihat keuangan", to: "/pengelola/keuangan" }}
      >
        <BillingSummaryCard billing={data.billing} />
      </DashboardSection>
    </div>
  )
}

function DesktopDashboard({ data }: { data: PengelolaDashboardData }) {
  const { today } = data
  const stats = [
    { value: today.sessions, label: "sesi les" },
    { value: today.tutorsOnDuty, label: "tutor bertugas" },
    { value: today.attendanceSubmitted, label: "sesi sudah dipresensi" },
  ]

  return (
    <div className="hidden flex-1 grid-cols-[minmax(0,1fr)_22.5rem] gap-ns-4xl lg:grid">
      <div className="flex flex-col gap-12">
        <DashboardSection title="Perlu tindakan" headingClassName="text-headline">
          <TaskActionList
            tasks={data.tasks}
            emptyDescription="Tidak ada antrean verifikasi atau peninjauan."
          />
        </DashboardSection>

        <DashboardSection
          title={`Hari ini · ${formatWeekdayDate(today.date)}`}
          headingClassName="text-headline"
          action={{ label: "Lihat jadwal", to: "/pengelola/les" }}
          className="gap-ns-l"
        >
          <dl className="grid grid-cols-3">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col-reverse gap-ns-2xs",
                  index > 0 && "border-l border-grayscale-surface-disabled pl-ns-2xl"
                )}
              >
                <dt className="text-subtitle text-grayscale-text-subtitle">{stat.label}</dt>
                <dd className="text-h2 font-bold text-grayscale-text-title">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div
            className={cn(
              "flex items-center gap-ns-m rounded-(--comp-radius-md) px-ns-l py-ns-m",
              today.missingYesterday > 0 ? "bg-warning-subtle" : "bg-success-subtle"
            )}
          >
            {today.missingYesterday > 0 ? (
              <BellIcon aria-hidden="true" className="size-5 shrink-0 text-warning" />
            ) : (
              <CircleCheckIcon aria-hidden="true" className="size-5 shrink-0 text-success" />
            )}
            <div className="flex flex-col gap-ns-s leading-normal">
              <p className="text-body font-bold text-grayscale-text-title">
                {today.missingYesterday > 0
                  ? `${today.missingYesterday} presensi kemarin belum masuk`
                  : "Semua presensi kemarin sudah masuk"}
              </p>
              {today.missingYesterday > 0 && (
                <p className="text-subtitle text-grayscale-text-subtitle">
                  Pengingat otomatis terkirim ke tutor pukul 08.00
                </p>
              )}
            </div>
          </div>
        </DashboardSection>
      </div>

      <aside className="border-l border-grayscale-surface-disabled pl-ns-4xl">
        <DashboardSection
          title={`Tagihan ${data.billing.month}`}
          headingClassName="text-headline"
          action={{ label: "Lihat keuangan", to: "/pengelola/keuangan" }}
          className="gap-ns-l"
        >
          <BillingSummaryCard billing={data.billing} />
        </DashboardSection>
      </aside>
    </div>
  )
}

function BillingSummaryCard({
  billing,
}: {
  billing: PengelolaDashboardData["billing"]
}) {
  return (
    <Link
      to="/pengelola/keuangan"
      className="group flex flex-col gap-ns-l rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l outline-none transition-colors hover:border-grayscale-border-darker focus-visible:ring-2 focus-visible:ring-primary-border-lighter"
    >
      <div className="flex items-start gap-ns-s">
        <div className="flex flex-1 flex-col gap-ns-s leading-normal">
          <p className="text-body font-bold text-grayscale-text-title">
            {formatRupiahCompact(billing.paidAmount)} dari{" "}
            {formatRupiahCompact(billing.totalAmount)} terbayar
          </p>
          <p className="text-caption text-grayscale-text-caption">
            {billing.invoices} tagihan siswa · jatuh tempo{" "}
            {formatDayMonth(billing.dueDate)}
          </p>
        </div>
        <ChevronRightIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-grayscale-text-body"
        />
      </div>
      <StackedProgressBar
        total={billing.invoices}
        segments={[
          { label: "Lunas", value: billing.lunas, tone: "success" },
          { label: "Sebagian", value: billing.sebagian, tone: "warning" },
        ]}
        remainderLabel="Belum bayar"
        showLegend
      />
    </Link>
  )
}

export { PengelolaDashboard }
