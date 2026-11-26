import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  CircleCheckIcon,
  CircleXIcon,
  LockIcon,
  PencilIcon,
  UserIcon,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  ConfirmDialog,
  Button,
  Checkbox,
  DataState,
  ListItem,
  Sheet,
  SheetContent,
  SheetTitle,
  toast,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import { initialsOf } from "@/features/data-master/api/data-master"
import {
  InfoCard,
  ProfileHeader,
} from "@/features/data-master/components/profile-parts"
import {
  accountQuery,
  linkableStudentsQuery,
  linkStudents,
  NotFoundError,
  resetPassword,
  ROLE_LABEL,
  setAccountStatus,
  type AccountDetail,
} from "@/features/manajemen-akun/api/akun"
import { formatRelativeDay } from "@/lib/format/date"

/*
 * P10 · Detail Akun · Figma "Manajemen Akun / Detail" dan "Konfirmasi reset
 * password".
 *
 * Identitas (peran · tanggal dibuat, status) → Data akun (email, username,
 * WhatsApp, login terakhir) → [wali] Siswa tertaut + Tautkan siswa →
 * Tindakan: Ubah data akun · Reset password (konfirmasi, password sementara
 * dikirim ke email) · Nonaktifkan / Aktifkan kembali akun.
 */
const lastLogin = (d: Date | null) =>
  d ? `${formatRelativeDay(d)}, ${format(d, "HH.mm")}` : "Belum pernah login"

function DetailAkun() {
  const { accountId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(accountQuery(accountId))
  const account = query.data

  return (
    <DetailScreen title="Detail Akun">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat akun…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Akun tidak ditemukan"
            description="Akun ini mungkin sudah dihapus atau tautannya keliru."
            action={{
              label: "Kembali ke Manajemen Akun",
              onClick: () => navigate("/pengelola/akun", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Akun gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : account ? (
        <AccountBody account={account} />
      ) : null}
    </DetailScreen>
  )
}

function AccountBody({ account }: { account: AccountDetail }) {
  const queryClient = useQueryClient()
  const [resetOpen, setResetOpen] = React.useState(false)
  const [statusOpen, setStatusOpen] = React.useState(false)
  const [linkOpen, setLinkOpen] = React.useState(false)
  const active = account.status === "aktif"
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["manajemen-akun"] })

  const reset = useMutation({
    mutationFn: () => resetPassword(account.id),
    networkMode: "always",
    onSuccess: ({ email }) =>
      toast.success("Password direset", {
        description: `Password sementara dikirim ke ${email}.`,
      }),
    onError: () =>
      toast.error("Password gagal direset", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  const status = useMutation({
    mutationFn: () =>
      setAccountStatus(account.id, active ? "nonaktif" : "aktif"),
    networkMode: "always",
    onSuccess: (updated) => {
      void invalidate()
      toast.success(
        updated.status === "aktif" ? "Akun aktif kembali" : "Akun dinonaktifkan",
        {
          description:
            updated.status === "aktif"
              ? `${updated.name} bisa login lagi.`
              : `${updated.name} tidak bisa login sampai akun diaktifkan kembali.`,
        }
      )
    },
    onError: () =>
      toast.error("Status akun gagal diubah", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  return (
    <>
      <ProfileHeader
        name={account.name}
        initials={initialsOf(account.name)}
        caption={`${ROLE_LABEL[account.role]} · dibuat ${format(account.createdAt, "d MMM yyyy", { locale: localeId })}`}
        status={account.status}
      />
      <InfoCard
        title="Data akun"
        rows={[
          ["Email", <span className="break-all">{account.email}</span>],
          ["Username", account.username],
          ["WhatsApp", account.phone],
          ["Login terakhir", lastLogin(account.lastLoginAt)],
        ]}
      />

      {account.role === "wali" && (
        <section className="gap-ns-m flex flex-col">
          <div className="gap-ns-s flex items-center justify-between">
            <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
              Siswa tertaut
            </h2>
            <Button
              variant="tertiary"
              size="sm"
              className="-my-ns-s -mr-ns-l"
              onClick={() => setLinkOpen(true)}
            >
              Tautkan siswa
            </Button>
          </div>
          {account.students.length > 0 ? (
            <DashboardList>
              {account.students.map((s) => (
                <ListItem
                  key={s.id}
                  icon={<UserIcon />}
                  title={s.name}
                  description={`Kelas ${s.grade} · ${s.status}`}
                  chevron
                  render={<Link to={`/pengelola/siswa/${s.id}`} />}
                />
              ))}
            </DashboardList>
          ) : (
            <p className="border-grayscale-border-default bg-grayscale-surface-default p-ns-l text-subtitle text-grayscale-text-caption rounded-(--comp-radius-md) border leading-normal">
              Belum ada siswa tertaut. Wali hanya bisa melihat data siswa yang
              ditautkan ke akunnya.
            </p>
          )}
        </section>
      )}

      <section className="gap-ns-m flex flex-col">
        <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
          Tindakan
        </h2>
        <DashboardList>
          <ListItem
            icon={<PencilIcon />}
            title="Ubah data akun"
            chevron
            render={<Link to={`/pengelola/akun/${account.id}/ubah`} />}
          />
          <ListItem
            icon={<LockIcon />}
            title="Reset password"
            description="Kirim password sementara ke email"
            chevron
            render={
              <button
                type="button"
                disabled={reset.isPending}
                onClick={() => setResetOpen(true)}
              />
            }
          />
          <ListItem
            icon={active ? <CircleXIcon /> : <CircleCheckIcon />}
            title={active ? "Nonaktifkan akun" : "Aktifkan kembali akun"}
            description={
              active
                ? "Akun tidak bisa dipakai untuk login"
                : "Akun bisa dipakai untuk login lagi"
            }
            chevron
            render={
              <button
                type="button"
                disabled={status.isPending}
                onClick={() => setStatusOpen(true)}
              />
            }
          />
        </DashboardList>
      </section>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        tone="warning"
        showDismiss={false}
        title={`Reset password ${account.name}?`}
        description={`Password lama tidak berlaku lagi. Password sementara dikirim ke ${account.email}.`}
        confirmLabel="Reset Password"
        onConfirm={async () => {
          await reset.mutateAsync().catch(() => undefined)
        }}
      />
      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        tone={active ? "destructive" : "default"}
        showDismiss={false}
        title={
          active
            ? `Nonaktifkan akun ${account.name}?`
            : `Aktifkan kembali akun ${account.name}?`
        }
        description={
          active
            ? "Pengguna akan keluar dari aplikasi dan tidak bisa login. Data dan riwayatnya tetap tersimpan."
            : "Pengguna bisa login lagi dengan password yang sama."
        }
        confirmLabel={active ? "Nonaktifkan" : "Aktifkan"}
        onConfirm={async () => {
          await status.mutateAsync().catch(() => undefined)
        }}
      />
      {account.role === "wali" && (
        <LinkStudentsSheet
          open={linkOpen}
          onOpenChange={setLinkOpen}
          account={account}
        />
      )}
    </>
  )
}

/* Sheet "Tautkan siswa": centang siswa yang bisa dilihat akun wali ini */
function LinkStudentsSheet({
  open,
  onOpenChange,
  account,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountDetail
}) {
  const queryClient = useQueryClient()
  const students = useQuery({ ...linkableStudentsQuery(), enabled: open })
  const [selected, setSelected] = React.useState<string[]>(account.studentIds)

  const handleOpenChange = (next: boolean) => {
    if (next) setSelected(account.studentIds)
    onOpenChange(next)
  }

  const save = useMutation({
    mutationFn: () => linkStudents(account.id, selected),
    networkMode: "always",
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["manajemen-akun"] })
      toast.success("Siswa tertaut diperbarui", {
        description: `${updated.students.length} siswa tertaut ke akun ${updated.name}.`,
      })
      onOpenChange(false)
    },
    onError: () =>
      toast.error("Siswa gagal ditautkan", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  /* Siswa yang sudah tertaut tampil paling atas */
  const options = (students.data ?? [])
    .slice()
    .sort(
      (a, b) =>
        Number(account.studentIds.includes(b.id)) -
        Number(account.studentIds.includes(a.id))
    )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-ns-l px-ns-l pt-ns-m sm:max-w-md max-h-[85dvh] rounded-t-2xl pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))] sm:mx-auto"
      >
        <span
          aria-hidden="true"
          className="bg-grayscale-border-disabled mx-auto h-1 w-10 shrink-0 rounded-full"
        />
        <SheetTitle className="text-headline">Tautkan siswa</SheetTitle>
        {students.isPending ? (
          <DataState state="loading" bare loadingLabel="Memuat siswa…" />
        ) : students.isError ? (
          <DataState
            state="error"
            bare
            title="Daftar siswa gagal dimuat"
            action={{ label: "Coba lagi", onClick: () => students.refetch() }}
          />
        ) : (
          <fieldset className="-mx-ns-l px-ns-l flex min-h-0 flex-col overflow-y-auto">
            <legend className="sr-only">Pilih siswa</legend>
            {options.map((s) => (
              <div key={s.id} className="flex min-h-12 items-center">
                <Checkbox
                  label={`${s.name} · Kelas ${s.grade}`}
                  checked={selected.includes(s.id)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) =>
                      checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                    )
                  }
                />
              </div>
            ))}
          </fieldset>
        )}
        <div className="gap-ns-m pt-ns-s flex *:flex-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : `Simpan (${selected.length})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { DetailAkun }
