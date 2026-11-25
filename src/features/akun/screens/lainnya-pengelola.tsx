import { useQuery } from "@tanstack/react-query"
import {
  BellIcon,
  BookOpenIcon,
  GraduationCapIcon,
  LockIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import { Link } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { pengelolaMenuQuery } from "@/features/akun/api/akun"
import { LogoutItem } from "@/features/akun/components/account-help"
import { AccountProfile } from "@/features/akun/components/account-profile"
import { pengelolaDashboardQuery } from "@/features/dashboard/api/pengelola-dashboard"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"

/*
 * P1 · Menu Lainnya (pengelola) · Figma "Lainnya / Pengelola"
 *
 * Profil (avatar 48px, nama, Pengelola LBB · email) → Data master (Data
 * Tutor, Data Siswa, Manajemen Akun) → Laporan (Rekap & Riwayat Les,
 * Laporan Keuangan) → Notifikasi (Pengaturan, Riwayat) → Keluar.
 * Tiap menu membuka layar P8–P13.
 */
function LainnyaPengelola() {
  const query = useQuery(pengelolaMenuQuery())
  const data = query.data
  /* TODO(P14): ganti dengan jumlah dari layar Notifikasi pengelola */
  const unread = useQuery({
    ...pengelolaDashboardQuery(),
    select: (d) => d.unreadNotifications,
  }).data

  return (
    <TabScreen
      title="Lainnya"
      action={<NotificationButton to="/pengelola/notifikasi" unread={unread} />}
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat menu…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Menu gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-ns-2xl">
            <AccountProfile
              size="compact"
              name={data.name}
              initials={data.initials}
              role={data.role}
              email={data.email}
            />

            <DashboardSection title="Data master">
              <DashboardList>
                <ListItem
                  icon={<GraduationCapIcon />}
                  title="Data Tutor"
                  description={`${data.tutors.total} tutor · ${data.tutors.active} aktif`}
                  chevron
                  render={<Link to="/pengelola/tutor" />}
                />
                <ListItem
                  icon={<UsersIcon />}
                  title="Data Siswa"
                  description={`${data.students.total} siswa · ${data.students.active} aktif`}
                  chevron
                  render={<Link to="/pengelola/siswa" />}
                />
                <ListItem
                  icon={<LockIcon />}
                  title="Manajemen Akun"
                  description="Wali, tutor, dan pengelola"
                  chevron
                  render={<Link to="/pengelola/akun" />}
                />
              </DashboardList>
            </DashboardSection>

            <DashboardSection title="Laporan">
              <DashboardList>
                <ListItem
                  icon={<BookOpenIcon />}
                  title="Rekap & Riwayat Les"
                  description="Sesi per tutor dan siswa"
                  chevron
                  render={<Link to="/pengelola/riwayat" />}
                />
                <ListItem
                  icon={<ReceiptIcon />}
                  title="Laporan Keuangan"
                  description="Tagihan, pembayaran, dan honor"
                  chevron
                  render={<Link to="/pengelola/laporan-keuangan" />}
                />
              </DashboardList>
            </DashboardSection>
          </div>

          <div className="flex flex-col gap-ns-2xl">
            <DashboardSection title="Notifikasi">
              <DashboardList>
                <ListItem
                  icon={<SettingsIcon />}
                  title="Pengaturan Notifikasi"
                  description="Template dan waktu pengingat"
                  chevron
                  render={<Link to="/pengelola/pengaturan-notifikasi" />}
                />
                <ListItem
                  icon={<BellIcon />}
                  title="Riwayat Notifikasi"
                  description={
                    data.failedNotifications > 0
                      ? `${data.failedNotifications} gagal terkirim`
                      : "Semua terkirim"
                  }
                  chevron
                  render={<Link to="/pengelola/riwayat-notifikasi" />}
                />
              </DashboardList>
            </DashboardSection>

            <LogoutItem description="Anda perlu masuk lagi dengan email/username dan password untuk mengelola data LBB." />
          </div>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { LainnyaPengelola }
