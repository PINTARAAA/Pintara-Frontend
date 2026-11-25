import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { InfoIcon, LogOutIcon, PhoneIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { ListItem } from "@/components/ui/list-item"
import { logout, type LbbContact } from "@/features/akun/api/akun"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"

/*
 * Bagian bawah layar Akun (W8 · T6): Bantuan (Hubungi Pengelola LBB via
 * WhatsApp, Tentang PINTARA) → Keluar (Confirmation modal, lalu ke
 * /masuk?alasan=keluar setelah cache data dibuang).
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmLogout, setConfirmLogout] = React.useState(false)
  const [aboutOpen, setAboutOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    /* Buang data akun sebelumnya agar tidak tampil ke pengguna berikutnya */
    queryClient.clear()
    navigate("/masuk?alasan=keluar", { replace: true })
  }

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

      <DashboardList>
        <ListItem
          icon={<LogOutIcon />}
          title="Keluar"
          render={<button type="button" onClick={() => setConfirmLogout(true)} />}
        />
      </DashboardList>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        showIcon={false}
        showDismiss={false}
        title="Keluar dari PINTARA?"
        description={logoutDescription}
        confirmLabel="Keluar"
        onConfirm={handleLogout}
      />

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

export { AccountHelp }
