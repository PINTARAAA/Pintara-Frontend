import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  Button,
  DataState,
  toast,
} from "@/components"
import { InfoCard } from "@/features/data-master/components"
import {
  channelContact,
  KIND_LABEL,
  NotFoundError,
  notificationLogQuery,
  recipientLabel,
  resendNotification,
  ResendFailedError,
  type NotificationLog,
} from "@/features/riwayat-notifikasi/api"

/*
 * P13 · Detail Notifikasi · Figma "Riwayat Notifikasi / Detail gagal".
 *
 * Kartu judul (jenis, waktu, status) → Pengiriman (penerima, kanal · kontak,
 * percobaan, penyebab) → Isi pesan → catatan. Gagal: bilah aksi Ubah Kontak
 * (Manajemen Akun) · Kirim Ulang; berhasil → kembali ke daftar dengan toast.
 */
const stamp = (d: Date) => format(d, "EEEE, d MMM yyyy · HH.mm", { locale: localeId })

function DetailNotifikasi() {
  const { logId = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(notificationLogQuery(logId))
  const log = query.data
  const contactAccount =
    log?.recipients.length === 1 ? log.recipients[0].accountId : undefined

  const resend = useMutation({
    mutationFn: () => resendNotification(logId),
    networkMode: "always",
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["riwayat-notifikasi"] })
      toast.success("Notifikasi terkirim ulang", {
        description: `Status ke ${updated.recipients.map((r) => r.name).join(", ")} diperbarui menjadi Terkirim.`,
      })
      navigate(-1)
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["riwayat-notifikasi"] })
      toast.error("Notifikasi masih gagal terkirim", {
        description:
          error instanceof ResendFailedError
            ? `${error.reason}. Perbarui kontak penerima lalu kirim ulang.`
            : "Periksa koneksi Anda, lalu coba lagi.",
      })
    },
  })

  return (
    <DetailScreen
      title="Detail Notifikasi"
      footer={
        log?.status === "gagal" && (
          <>
            {contactAccount && (
              <Button
                variant="secondary"
                nativeButton={false}
                render={<Link to={`/pengelola/akun/${contactAccount}/ubah`} />}
              >
                Ubah Kontak
              </Button>
            )}
            <Button onClick={() => resend.mutate()} disabled={resend.isPending}>
              {resend.isPending ? "Mengirim…" : "Kirim Ulang"}
            </Button>
          </>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat notifikasi…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Log notifikasi tidak ditemukan"
            description="Log ini mungkin sudah dihapus atau tautannya keliru."
            action={{
              label: "Kembali ke Riwayat Notifikasi",
              onClick: () => navigate("/pengelola/riwayat-notifikasi", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Notifikasi gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : log ? (
        <LogBody log={log} />
      ) : null}
    </DetailScreen>
  )
}

function LogBody({ log }: { log: NotificationLog }) {
  const failed = log.status === "gagal"
  return (
    <>
      <section
        aria-label="Ringkasan notifikasi"
        className="gap-ns-2xs border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col items-start rounded-(--comp-radius-md) border leading-normal"
      >
        <h2 className="text-body text-grayscale-text-title font-bold">
          {KIND_LABEL[log.kind]}
        </h2>
        <p className="text-caption text-grayscale-text-caption">{stamp(log.sentAt)}</p>
        <StatusBadge category="notifikasi" status={log.status} className="mt-ns-xs" />
      </section>

      <InfoCard
        title="Pengiriman"
        rows={[
          ["Penerima", log.recipients.map(recipientLabel).join(", ")],
          ["Kanal", channelContact(log)],
          [
            "Percobaan",
            `${log.attempts} kali, terakhir ${format(log.lastAttemptAt, "HH.mm")}`,
          ],
          ...(failed && log.reason
            ? ([["Penyebab", log.reason]] as [string, string][])
            : []),
          ...(log.resentAt
            ? ([["Dikirim ulang", format(log.resentAt, "d MMM, HH.mm", { locale: localeId })]] as [
                string,
                string,
              ][])
            : []),
        ]}
      />

      <InfoCard title="Isi pesan">
        <p className="bg-grayscale-surface-subtitle px-ns-l py-ns-m text-subtitle text-grayscale-text-title rounded-(--comp-radius-md) leading-normal whitespace-pre-wrap">
          {log.message}
        </p>
      </InfoCard>

      {failed && (
        <p className="text-caption text-grayscale-text-caption leading-normal">
          {log.permanent
            ? `Kirim ulang tidak akan berhasil selama ${log.channel === "email" ? "email" : "nomor"} masih tidak aktif. Perbarui kontak ${log.recipients[0]?.role === "wali" ? "wali" : "tutor"} terlebih dahulu bila perlu.`
            : "Penyebab bersifat sementara. Kirim ulang biasanya berhasil setelah penerima kembali terjangkau."}
        </p>
      )}
    </>
  )
}

export { DetailNotifikasi }
