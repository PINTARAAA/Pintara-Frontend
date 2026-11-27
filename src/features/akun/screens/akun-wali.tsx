import { useQuery } from "@tanstack/react-query"
import { UserIcon } from "lucide-react"
import { Link } from "react-router"

import {
  TabScreen,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  ListItem,
} from "@/components"
import { waliAccountQuery } from "@/features/akun/api"
import { AccountHelp, AccountProfile } from "@/features/akun/components"

import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"
import { SummaryRow } from "@/features/pendaftaran/components"

/*
 * W8 · Akun (wali) · Figma "Akun / Wali" dan "Akun / Wali - Konfirmasi keluar"
 *
 * Profil (avatar 56px, nama, peran · email) → Siswa tertaut (+ tautan
 * "Daftarkan anak lain" ke W2, tambahan di luar Figma) → Data akun
 * (Kontak & login, hanya baca) → Bantuan (Hubungi Pengelola LBB, Tentang
 * PINTARA) → Keluar (Confirmation modal, lalu ke /masuk?alasan=keluar).
 *
 * Desktop (≥ lg, frame "Akun / Wali (Desktop)"): halaman putih, Page header
 * "Akun"; Profil · Siswa tertaut · Data akun di kolom utama, Bantuan + Keluar
 * 380px di kanan (jarak 32, gap tiap kolom 24).
 */
function AkunWali() {
  const query = useQuery(waliAccountQuery())
  const account = query.data

  return (
    <TabScreen title="Akun" desktopHeader="page">
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
        <div className="grid gap-ns-2xl lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:items-start lg:gap-x-ns-3xl">
          <div className="flex flex-col gap-ns-2xl">
            <AccountProfile
              name={account.name}
              initials={account.initials}
              role={account.role}
              email={account.email}
            />

            <DashboardSection
              title="Siswa tertaut"
              action={{ label: "Daftarkan anak lain", to: "/wali/pendaftaran" }}
            >
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
