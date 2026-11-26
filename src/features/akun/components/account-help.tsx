import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { InfoIcon, LogOutIcon, PhoneIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { ConfirmDialog, ListItem } from "@/components"
import { logout, type LbbContact } from "@/features/akun/api"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"

/*
 * Bagian bawah layar Akun (W8 · T6): Bantuan (Hubungi Pengelola LBB via
 * WhatsApp, Tentang PINTARA) → Keluar.
 */
function AccountHelp({
  lbbContact,
  appVersion,
  logoutDescription,
}: {
  lbbContact: LbbContact
  appVersion: string
  logoutDescription: string
}) {
  const [aboutOpen, setAboutOpen] = React.useState(false)

  return (
    <>
      <DashboardSection title="Bantuan">
        <DashboardList>
          <ListItem
            icon={<PhoneIcon />}
            title="Hubungi Pengelola LBB"
            description={`WhatsApp ${lbbContact.name} · ${lbbContact.display}`}
            chevron
            render={
              <a
                href={`https://wa.me/${lbbContact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          />
          <ListItem
            icon={<InfoIcon />}
            title="Tentang PINTARA"
            description={`Versi ${appVersion}`}
            chevron
            render={<button type="button" onClick={() => setAboutOpen(true)} />}
          />
        </DashboardList>
      </DashboardSection>

      <LogoutItem description={logoutDescription} />

      <ConfirmDialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        showCancel={false}
        title="Tentang PINTARA"
        description={`PINTARA membantu wali murid, tutor, dan Pengelola LBB mengelola les privat: pendaftaran, jadwal, presensi, dan pembayaran. Versi ${appVersion}.`}
        confirmLabel="Tutup"
        onConfirm={() => undefined}
      />
    </>
  )
}

/*
 * Grup "Keluar" (W8 · T6 · P1): Confirmation modal, lalu ke
 * /masuk?alasan=keluar setelah cache data dibuang.
 */
function LogoutItem({ description }: { description: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    /* Buang data akun sebelumnya agar tidak tampil ke pengguna berikutnya */
    queryClient.clear()
    navigate("/masuk?alasan=keluar", { replace: true })
  }

  return (
    <>
      <DashboardList>
        <ListItem
          icon={<LogOutIcon />}
          title="Keluar"
          render={<button type="button" onClick={() => setOpen(true)} />}
        />
      </DashboardList>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        showIcon={false}
        showDismiss={false}
        title="Keluar dari PINTARA?"
        description={description}
        confirmLabel="Keluar"
        onConfirm={handleLogout}
      />
    </>
  )
}

export { AccountHelp, LogoutItem }
