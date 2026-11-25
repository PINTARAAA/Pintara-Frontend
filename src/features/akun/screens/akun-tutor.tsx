import { useQuery } from "@tanstack/react-query"

import { TabScreen } from "@/components/layouts/tab-screen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataState } from "@/components/ui/data-state"
import { tutorAccountQuery } from "@/features/akun/api/akun"
import { AccountHelp } from "@/features/akun/components/account-help"
import { AccountProfile } from "@/features/akun/components/account-profile"
import { DashboardSection } from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { useTutorUnreadNotifications } from "@/features/notifikasi/api/notifikasi-tutor"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import { formatRupiah } from "@/lib/format/currency"

/*
 * T6 · Akun (tutor) · Figma "Akun / Tutor"
 *
 * Profil (avatar 56px, nama, Tutor · email) → Profil mengajar (kartu
 * "Kualifikasi & ketersediaan": Mata pelajaran · Jenjang · Hari · Tarif,
 * hanya baca, dikelola Pengelola LBB) → Bantuan (Hubungi Pengelola LBB,
 * Tentang PINTARA) → Keluar (Confirmation modal seperti W8).
 */
function AkunTutor() {
  const query = useQuery(tutorAccountQuery())
  const account = query.data
  const unread = useTutorUnreadNotifications()

  return (
    <TabScreen
      title="Akun"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat akun…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Akun gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : account ? (
        <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-ns-2xl">
            <AccountProfile
              name={account.name}
              initials={account.initials}
              role={account.role}
              email={account.email}
            />

            <DashboardSection title="Profil mengajar">
              <Card size="compact">
                <CardHeader>
                  <CardTitle>Kualifikasi &amp; ketersediaan</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-ns-m">
                    <SummaryRow label="Mata pelajaran" labelClassName="w-[104px]">
                      {account.teaching.subjects.join(", ")}
                    </SummaryRow>
                    <SummaryRow label="Jenjang" labelClassName="w-[104px]">
                      {account.teaching.levels}
                    </SummaryRow>
                    <SummaryRow label="Hari" labelClassName="w-[104px]">
                      {account.teaching.availability}
                    </SummaryRow>
                    <SummaryRow label="Tarif" labelClassName="w-[104px]">
                      {formatRupiah(account.teaching.rate)} per sesi
                    </SummaryRow>
                  </dl>
                </CardContent>
              </Card>
              <p className="text-caption leading-normal text-grayscale-text-caption">
                Data di atas dikelola Pengelola LBB. Hubungi Pengelola untuk
                perubahan.
              </p>
            </DashboardSection>
          </div>

          <div className="flex flex-col gap-ns-2xl">
            <AccountHelp
              lbbContact={account.lbbContact}
              appVersion={account.appVersion}
              logoutDescription="Anda perlu masuk lagi dengan email/username dan password untuk mengisi presensi dan melihat jadwal mengajar."
            />
          </div>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { AkunTutor }
