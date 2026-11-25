import { useQuery } from "@tanstack/react-query"
import { UserIcon } from "lucide-react"
import { Link } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { waliAccountQuery } from "@/features/akun/api/akun"
import { AccountHelp } from "@/features/akun/components/account-help"
import { AccountProfile } from "@/features/akun/components/account-profile"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"

/*
 * W8 · Akun (wali) · Figma "Akun / Wali" dan "Akun / Wali - Konfirmasi keluar"
 *
 * Profil (avatar 56px, nama, peran · email) → Siswa tertaut → Data akun
 * (Kontak & login, hanya baca) → Bantuan (Hubungi Pengelola LBB, Tentang
 * PINTARA) → Keluar (Confirmation modal, lalu ke /masuk?alasan=keluar).
 */
function AkunWali() {
  const query = useQuery(waliAccountQuery())
  const account = query.data

  return (
    <TabScreen title="Akun">
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

            <DashboardSection title="Siswa tertaut">
              <DashboardList>
                {account.students.map((student) => (
                  <ListItem
                    key={student.id}
                    icon={<UserIcon />}
                    title={student.name}
                    description={`${student.grade} · ${student.subjects.join(", ")}`}
                    chevron
                    render={<Link to={`/wali/jadwal?siswa=${student.id}`} />}
                  />
                ))}
              </DashboardList>
            </DashboardSection>

            <DashboardSection title="Data akun">
              <Card size="compact">
                <CardHeader>
                  <CardTitle>Kontak &amp; login</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-ns-m">
                    <SummaryRow label="Email" labelClassName="w-[104px]">
                      <span className="break-all">{account.email}</span>
                    </SummaryRow>
                    <SummaryRow label="WhatsApp" labelClassName="w-[104px]">
                      {account.whatsapp}
                    </SummaryRow>
                    <SummaryRow label="Username" labelClassName="w-[104px]">
                      {account.username}
                    </SummaryRow>
                  </dl>
                </CardContent>
              </Card>
              <p className="text-caption leading-normal text-grayscale-text-caption">
                Perlu mengubah data atau password? Hubungi Pengelola LBB.
              </p>
            </DashboardSection>
          </div>

          <div className="flex flex-col gap-ns-2xl">
            <AccountHelp
              lbbContact={account.lbbContact}
              appVersion={account.appVersion}
              logoutDescription={`Anda perlu masuk lagi dengan email/username dan password untuk mengakses data ${account.students.map((s) => s.name.split(" ")[0]).join(" dan ")}.`}
            />
          </div>
        </div>
      ) : null}
    </TabScreen>
  )
}

export { AkunWali }
