import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { InfoIcon, LogOutIcon, PhoneIcon, UserIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { logout, waliAccountQuery } from "@/features/akun/api/akun"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { InitialsAvatar } from "@/features/dashboard/components/initials-avatar"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"

/*
 * W8 · Akun (wali) · Figma "Akun / Wali" dan "Akun / Wali - Konfirmasi keluar"
 *
 * Profil (avatar 56px, nama, peran · email) → Siswa tertaut → Data akun
 * (Kontak & login, hanya baca) → Bantuan (Hubungi Pengelola LBB, Tentang
 * PINTARA) → Keluar (Confirmation modal, lalu ke /masuk?alasan=keluar).
 */
function AkunWali() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(waliAccountQuery())
  const account = query.data
  const [confirmLogout, setConfirmLogout] = React.useState(false)
  const [aboutOpen, setAboutOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    /* Buang data akun sebelumnya agar tidak tampil ke pengguna berikutnya */
    queryClient.clear()
    navigate("/masuk?alasan=keluar", { replace: true })
  }

  const studentNames = account?.students.map((s) => s.name.split(" ")[0])

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
            <section
              aria-label="Profil"
              className="flex items-center gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l"
            >
              <InitialsAvatar
                initials={account.initials}
                className="size-14 text-body"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
                <p className="text-body font-bold text-grayscale-text-title">
                  {account.name}
                </p>
                <p className="truncate text-caption text-grayscale-text-caption">
                  {account.role} · {account.email}
                </p>
              </div>
            </section>

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
            <DashboardSection title="Bantuan">
              <DashboardList>
                <ListItem
                  icon={<PhoneIcon />}
                  title="Hubungi Pengelola LBB"
                  description={`WhatsApp ${account.lbbContact.name} · ${account.lbbContact.display}`}
                  chevron
                  render={
                    <a
                      href={`https://wa.me/${account.lbbContact.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                />
                <ListItem
                  icon={<InfoIcon />}
                  title="Tentang PINTARA"
                  description={`Versi ${account.appVersion}`}
                  chevron
                  render={<button type="button" onClick={() => setAboutOpen(true)} />}
                />
              </DashboardList>
            </DashboardSection>

            <DashboardList>
              <ListItem
                icon={<LogOutIcon />}
                title="Keluar"
                render={
                  <button type="button" onClick={() => setConfirmLogout(true)} />
                }
              />
            </DashboardList>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        showIcon={false}
        showDismiss={false}
        title="Keluar dari PINTARA?"
        description={`Anda perlu masuk lagi dengan email/username dan password untuk mengakses data ${studentNames?.join(" dan ") ?? "anak Anda"}.`}
        confirmLabel="Keluar"
        onConfirm={handleLogout}
      />

      <ConfirmDialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        showCancel={false}
        title="Tentang PINTARA"
        description={`PINTARA membantu wali murid, tutor, dan Pengelola LBB mengelola les privat: pendaftaran, jadwal, presensi, dan pembayaran. Versi ${account?.appVersion ?? "-"}.`}
        confirmLabel="Tutup"
        onConfirm={() => undefined}
      />
    </TabScreen>
  )
}

export { AkunWali }
