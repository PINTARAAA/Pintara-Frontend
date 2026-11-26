import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EllipsisIcon } from "lucide-react"
import { useNavigate } from "react-router"

import {
  ConfirmDialog,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
  TopAppBarButton,
} from "@/components"
import {
  ActiveScheduleError,
  type AccountStatus,
} from "@/features/data-master/api"
import { InitialsAvatar } from "@/features/dashboard/components"
import { SummaryRow } from "@/features/pendaftaran/components"

/*
 * Potongan layar Profil Tutor / Profil Siswa (P9): kartu identitas (avatar
 * inisial 56px, nama, keterangan, badge status), kartu info (judul + baris
 * label 110px · nilai), menu ⋯ di top app bar, dan tombol Nonaktifkan /
 * Aktifkan kembali beserta dialognya.
 */
function ProfileHeader({
  name,
  initials,
  caption,
  status,
}: {
  name: string
  initials: string
  caption: React.ReactNode
  status: AccountStatus
}) {
  return (
    <section
      aria-label="Identitas"
      className="gap-ns-l border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex items-center rounded-(--comp-radius-md) border leading-normal"
    >
      <InitialsAvatar initials={initials} className="text-subtitle size-14" />
      <div className="gap-ns-2xs flex min-w-0 flex-col items-start">
        <h2 className="text-body text-grayscale-text-title font-bold">{name}</h2>
        <p className="text-caption text-grayscale-text-caption">{caption}</p>
        <StatusBadge category="akun" status={status} className="mt-ns-2xs" />
      </div>
    </section>
  )
}

function InfoCard({
  title,
  rows,
  children,
}: {
  title: string
  rows?: [label: string, value: React.ReactNode][]
  children?: React.ReactNode
}) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows && (
          <dl className="gap-ns-m flex flex-col">
            {rows.map(([label, value]) => (
              <SummaryRow key={label} label={label}>
                {value}
              </SummaryRow>
            ))}
          </dl>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

/* Menu ⋯ di top app bar profil */
function ProfileMenu({
  items,
}: {
  items: { label: string; onClick: () => void }[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<TopAppBarButton label="Menu lainnya" variant="plain" />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className="min-h-12"
              onClick={item.onClick}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*
 * Tombol Nonaktifkan / Aktifkan kembali. Nonaktifkan → konfirmasi →
 * (masih ada jadwal aktif) dialog "… belum bisa dinonaktifkan" dengan aksi
 * Lihat Jadwal — Figma "Data Tutor / Tidak bisa dinonaktifkan".
 */
function StatusToggle({
  status,
  shortName,
  queryKey,
  scheduleHint,
  deactivateNote,
  activeSchedules,
  onChange,
}: {
  status: AccountStatus
  /* Jadwal aktif yang diketahui; > 0 langsung menampilkan dialog gagal */
  activeSchedules: number
  /* Nama sapaan untuk judul dialog, mis. "Kak Budi" */
  shortName: string
  /* Query yang di-invalidate setelah status berubah */
  queryKey: readonly unknown[]
  /* Saran pada dialog gagal, mis. "Pindahkan jadwal ke tutor lain" */
  scheduleHint: string
  deactivateNote: string
  onChange: (status: AccountStatus) => Promise<unknown>
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [blocked, setBlocked] = React.useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: onChange,
    networkMode: "always",
    onSuccess: (_, next) => {
      void queryClient.invalidateQueries({ queryKey })
      toast.success(
        next === "nonaktif"
          ? `${shortName} dinonaktifkan`
          : `${shortName} aktif kembali`
      )
    },
    onError: (error) => {
      if (error instanceof ActiveScheduleError) setBlocked(error.schedules)
      else
        toast.error("Status gagal diubah", {
          description: "Periksa koneksi Anda, lalu coba lagi.",
        })
    },
  })

  if (status === "nonaktif") {
    return (
      <Button
        variant="secondary"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate("aktif")}
      >
        {mutation.isPending ? "Mengaktifkan…" : "Aktifkan Kembali"}
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="secondary"
        disabled={mutation.isPending}
        onClick={() =>
          activeSchedules > 0
            ? setBlocked(activeSchedules)
            : setConfirmOpen(true)
        }
      >
        Nonaktifkan
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="destructive"
        title={`Nonaktifkan ${shortName}?`}
        description={deactivateNote}
        confirmLabel="Nonaktifkan"
        onConfirm={async () => {
          await mutation.mutateAsync("nonaktif").catch(() => undefined)
        }}
      />
      <ConfirmDialog
        open={blocked !== null}
        onOpenChange={(open) => !open && setBlocked(null)}
        tone="warning"
        showDismiss={false}
        title={`${shortName} belum bisa dinonaktifkan`}
        description={`Masih ada ${blocked ?? 0} jadwal les aktif. ${scheduleHint} terlebih dahulu, lalu coba lagi.`}
        cancelLabel="Tutup"
        confirmLabel="Lihat Jadwal"
        onConfirm={() => navigate("/pengelola/les?tab=jadwal")}
      />
    </>
  )
}

export { InfoCard, ProfileHeader, ProfileMenu, StatusToggle }
