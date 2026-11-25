import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { EllipsisIcon, MessageCircleIcon, PencilIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataState } from "@/components/ui/data-state"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast-api"
import { TopAppBarButton } from "@/components/ui/top-app-bar"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import {
  AlreadyProcessedError,
  needsTutor,
  NotFoundError,
  REJECT_REASONS,
  registrationQuery,
  verifyRegistration,
  type PengelolaRegistration,
} from "@/features/verifikasi/api/verifikasi"
import {
  formatRequestedSchedule,
  formatSubmitted,
} from "@/features/verifikasi/lib/format"

/*
 * P2 · Detail Pendaftaran · Figma "Verifikasi Pendaftaran / Detail",
 * "/ Konfirmasi verifikasi" dan "/ Terverifikasi".
 *
 * Kartu judul (nama, nomor · waktu kirim, badge status) → Data Siswa →
 * Data Wali → Kebutuhan Belajar (label 104px). Menu ⋯: hubungi wali,
 * perbaiki data. Bilah aksi sesuai status:
 *   menunggu      : Tolak (→ form tolak) · Verifikasi (Confirmation modal)
 *   terverifikasi : Ke Daftar · Cocokkan Tutor (P3, selama belum ada tutor)
 *   ditolak       : Ke Daftar (+ kartu alasan penolakan)
 */
const LIST = "/pengelola/pendaftaran"

/* "0813-2233-4455" → "6281322334455" (format wa.me) */
const toWhatsapp = (phone: string) =>
  phone.replace(/\D/g, "").replace(/^0/, "62")
const firstName = (name: string) => name.trim().split(/\s+/)[0]
const stamp = (date: Date) =>
  format(date, "d MMM yyyy, HH.mm", { locale: localeId })

function DetailPendaftaran() {
  const { registrationId = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(registrationQuery(registrationId))
  const registration = query.data
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const verify = useMutation({
    mutationFn: () => verifyRegistration(registrationId),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(
        registrationQuery(registrationId).queryKey,
        updated
      )
      void queryClient.invalidateQueries({ queryKey: ["verifikasi", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Pendaftaran terverifikasi", {
        description: `Data siswa dibuat. Notifikasi terkirim ke ${updated.parent.name}.`,
      })
    },
    onError: (error) => {
      if (error instanceof AlreadyProcessedError) {
        toast.error("Pendaftaran sudah diproses", {
          description: "Status terbaru ditampilkan.",
        })
        void query.refetch()
        void queryClient.invalidateQueries({
          queryKey: ["verifikasi", "daftar"],
        })
      } else {
        toast.error("Verifikasi gagal", {
          description: "Periksa koneksi Anda, lalu coba lagi.",
        })
      }
    },
  })

  return (
    <DetailScreen
      title="Detail Pendaftaran"
      action={registration && <MoreMenu registration={registration} />}
      footer={
        registration && (
          <Actions
            registration={registration}
            onVerify={() => setConfirmOpen(true)}
          />
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pendaftaran…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Pendaftaran tidak ditemukan"
            description="Pendaftaran ini mungkin sudah dihapus."
            action={{
              label: "Kembali ke Pendaftaran",
              onClick: () => navigate(LIST, { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Pendaftaran gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : registration ? (
        <>
          <RegistrationDetails registration={registration} />
          {registration.status === "menunggu_verifikasi" && (
            <p className="text-caption text-grayscale-text-caption leading-normal">
              Ada data yang keliru? Perbaiki lewat menu ⋯ sebelum memverifikasi.
            </p>
          )}

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            showDismiss={false}
            title={`Verifikasi pendaftaran ${firstName(registration.student.name)}?`}
            description={`Data siswa baru akan dibuat dan ${registration.parent.name} menerima notifikasi hasil verifikasi.`}
            confirmLabel="Verifikasi"
            onConfirm={async () => {
              await verify.mutateAsync().catch(() => undefined)
            }}
          />
        </>
      ) : null}
    </DetailScreen>
  )
}

function Actions({
  registration,
  onVerify,
}: {
  registration: PengelolaRegistration
  onVerify: () => void
}) {
  if (registration.status === "menunggu_verifikasi") {
    return (
      <>
        <Button
          variant="secondary"
          nativeButton={false}
          render={<Link to={`${LIST}/${registration.id}/tolak`} />}
        >
          Tolak
        </Button>
        <Button onClick={onVerify}>Verifikasi</Button>
      </>
    )
  }
  return (
    <>
      <Button
        variant="secondary"
        nativeButton={false}
        render={<Link to={LIST} />}
      >
        Ke Daftar
      </Button>
      {needsTutor(registration) && (
        <Button
          nativeButton={false}
          render={<Link to={`/pengelola/les/pencocokan/${registration.id}`} />}
        >
          Cocokkan Tutor
        </Button>
      )}
    </>
  )
}

function MoreMenu({ registration }: { registration: PengelolaRegistration }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<TopAppBarButton label="Opsi pendaftaran" variant="plain" />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        <DropdownMenuItem
          className="min-h-12"
          render={
            <a
              href={`https://wa.me/${toWhatsapp(registration.parent.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <MessageCircleIcon />
          Hubungi wali via WhatsApp
        </DropdownMenuItem>
        {registration.status === "menunggu_verifikasi" && (
          <DropdownMenuItem
            className="min-h-12"
            render={<Link to={`${LIST}/${registration.id}/ubah`} />}
          >
            <PencilIcon />
            Perbaiki data
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RegistrationDetails({
  registration: r,
}: {
  registration: PengelolaRegistration
}) {
  const row = "w-[104px]"
  return (
    <>
      <section
        aria-label="Ringkasan pendaftaran"
        className="gap-ns-s border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col items-start rounded-(--comp-radius-md) border leading-normal"
      >
        <h2 className="text-body text-grayscale-text-title font-bold">
          {r.student.name}
        </h2>
        <p className="text-caption text-grayscale-text-caption">
          {formatSubmitted(r)}
        </p>
        <StatusBadge category="pendaftaran" status={r.status} />
      </section>

      {r.status === "ditolak" && r.rejection && (
        <Card size="compact">
          <CardHeader>
            <CardTitle>Penolakan</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="gap-ns-m flex flex-col">
              <SummaryRow label="Alasan" labelClassName={row}>
                {
                  REJECT_REASONS.find((x) => x.value === r.rejection?.reason)
                    ?.label
                }
              </SummaryRow>
              <SummaryRow label="Pesan ke wali" labelClassName={row}>
                <span className="font-normal">{r.rejection.message}</span>
              </SummaryRow>
              <SummaryRow label="Ditolak" labelClassName={row}>
                {stamp(r.rejection.at)}
              </SummaryRow>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card size="compact">
        <CardHeader>
          <CardTitle>Data Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="gap-ns-m flex flex-col">
            <SummaryRow label="Nama" labelClassName={row}>
              {r.student.name}
            </SummaryRow>
            <SummaryRow label="Kelas" labelClassName={row}>
              {r.student.grade} {r.student.level}
            </SummaryRow>
            <SummaryRow label="Sekolah" labelClassName={row}>
              {r.student.school}
            </SummaryRow>
            <SummaryRow label="Alamat les" labelClassName={row}>
              {r.student.address}
            </SummaryRow>
          </dl>
        </CardContent>
      </Card>

      <Card size="compact">
        <CardHeader>
          <CardTitle>Data Wali</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="gap-ns-m flex flex-col">
            <SummaryRow label="Nama" labelClassName={row}>
              {r.parent.name}
            </SummaryRow>
            <SummaryRow label="WhatsApp" labelClassName={row}>
              {r.parent.whatsapp}
            </SummaryRow>
            <SummaryRow label="Akun" labelClassName={row}>
              <span className="break-all">{r.parent.email}</span>
            </SummaryRow>
          </dl>
        </CardContent>
      </Card>

      <Card size="compact">
        <CardHeader>
          <CardTitle>Kebutuhan Belajar</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="gap-ns-m flex flex-col">
            <SummaryRow label="Mata pelajaran" labelClassName={row}>
              {r.needs.subjects.join(", ")}
            </SummaryRow>
            <SummaryRow label="Frekuensi" labelClassName={row}>
              {r.needs.perWeek}× per minggu
            </SummaryRow>
            <SummaryRow label="Jadwal diminta" labelClassName={row}>
              {formatRequestedSchedule(r.needs)}
            </SummaryRow>
            {r.needs.notes && (
              <SummaryRow label="Catatan" labelClassName={row}>
                {r.needs.notes}
              </SummaryRow>
            )}
          </dl>
        </CardContent>
      </Card>

      {r.status === "terverifikasi" && r.verifiedAt && (
        <p className="text-caption text-grayscale-text-caption leading-normal">
          Diverifikasi {stamp(r.verifiedAt)}.{" "}
          {r.match
            ? `Tutor: ${r.match.tutorName} (dipilih ${stamp(r.match.at)}).`
            : `Langkah berikutnya: cocokkan tutor untuk ${firstName(r.student.name)}.`}
        </p>
      )}
    </>
  )
}

export { DetailPendaftaran }
