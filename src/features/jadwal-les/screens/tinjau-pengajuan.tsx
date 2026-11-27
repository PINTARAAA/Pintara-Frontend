import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  ConfirmDialog,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  DataState,
  toast,
} from "@/components"
import { NotFoundError } from "@/features/jadwal/api"
import {
  changeReviewQuery,
  formatRange,
  reviewChangeRequest,
  ScheduleConflictError,
  suggestFreeSlot,
} from "@/features/jadwal-les/api"
import type { ChangeReview } from "@/types/jadwal-les"
import { SummaryRow } from "@/features/pendaftaran/components"
import { firstName } from "@/lib/format"

/*
 * P5 · Tinjau Pengajuan Perubahan · Figma "Atur Jadwal / Tinjau
 * pengajuan perubahan".
 *
 * Ringkasan (pasangan, pengaju · waktu) → kartu Perubahan (Dari · Menjadi ·
 * Berlaku + alasan wali) → hasil cek bentrok (success/error) → Persetujuan
 * pihak terkait (wali & tutor, wajib dicentang). Bilah aksi: Tolak
 * (konfirmasi) · Setujui Perubahan. Keputusan dikirim ke wali (W4 · W9).
 *
 * Desktop (Figma "… / Tinjau pengajuan perubahan (Desktop)"): Page header
 * "← Les" dengan Tolak · Setujui Perubahan di kanan; ringkasan selebar
 * konten, lalu Perubahan + hasil cek bentrok di kiri dan Persetujuan pihak
 * terkait 420px di kanan (jarak 40).
 */
const LES_JADWAL = "/pengelola/les?tab=jadwal"
const stamp = (date: Date) => format(date, "d MMM, HH.mm", { locale: localeId })
const dayMonthYear = (date: Date) =>
  format(date, "d MMM yyyy", { locale: localeId })

function TinjauPengajuan() {
  const { requestId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(changeReviewQuery(requestId))

  if (query.data?.request.status === "ditinjau_pengelola") {
    return <ReviewForm review={query.data} />
  }

  return (
    <DetailScreen
      title="Pengajuan Perubahan"
      backLabel="Les"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pengajuan…" />
      ) : query.isError && !(query.error instanceof NotFoundError) ? (
        <DataState
          state="error"
          title="Pengajuan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Pengajuan tidak ditemukan"
              : "Pengajuan sudah diputuskan"
          }
          description={
            query.data
              ? `Pengajuan ini sudah ${query.data.request.status === "disetujui" ? "disetujui" : "ditolak"}.`
              : "Pengajuan ini mungkin sudah dibatalkan wali."
          }
          action={{
            label: "Kembali ke Jadwal",
            onClick: () => navigate(LES_JADWAL, { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

function ReviewForm({ review }: { review: ChangeReview }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { request, fromSession, toSession, conflict } = review
  const tutorShort = request.tutor.shortName
  const student = firstName(request.studentName)

  const [parentAgreed, setParentAgreed] = React.useState(false)
  const [tutorAgreed, setTutorAgreed] = React.useState(false)
  const [showConsentError, setShowConsentError] = React.useState(false)
  const [confirmReject, setConfirmReject] = React.useState(false)
  const consented = parentAgreed && tutorAgreed

  const decide = useMutation({
    mutationFn: (approved: boolean) =>
      reviewChangeRequest(request.id, approved),
    networkMode: "always",
    onSuccess: (_, approved) => {
      void queryClient.invalidateQueries({ queryKey: ["jadwal-les"] })
      void queryClient.invalidateQueries({ queryKey: ["jadwal"] })
      void queryClient.invalidateQueries({ queryKey: ["notifikasi"] })
      toast.success(approved ? "Perubahan disetujui" : "Pengajuan ditolak", {
        description: approved
          ? `Jadwal ${request.subject} ${student} pindah ke ${toSession.day}, ${formatRange(toSession)}. Wali sudah diberi tahu.`
          : `${request.parentName} sudah diberi tahu bahwa jadwal tetap.`,
      })
      navigate(LES_JADWAL, { replace: true })
    },
    onError: (error) => {
      if (error instanceof ScheduleConflictError) {
        toast.error("Jadwal baru bentrok", {
          description:
            "Ada jadwal lain yang baru tersimpan. Status terbaru ditampilkan.",
        })
        void queryClient.invalidateQueries({ queryKey: ["jadwal-les"] })
        return
      }
      toast.error("Keputusan gagal disimpan", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      })
    },
  })

  const scope =
    request.scope === "seterusnya"
      ? `Seterusnya, mulai ${dayMonthYear(request.effectiveDate)}`
      : `Sesi ${dayMonthYear(request.effectiveDate)} saja`

  return (
    <DetailScreen
      title="Pengajuan Perubahan"
      backLabel="Les"
      desktopHeader="page"
      desktopActions="header"
      desktopWidth="wide"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => setConfirmReject(true)}
            disabled={decide.isPending}
          >
            Tolak
          </Button>
          <Button
            onClick={() => {
              if (!consented) {
                setShowConsentError(true)
                return
              }
              decide.mutate(true)
            }}
            disabled={decide.isPending || !!conflict}
          >
            {decide.isPending ? "Menyimpan…" : "Setujui Perubahan"}
          </Button>
        </>
      }
    >
      <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
        <p className="text-subtitle text-grayscale-text-title font-bold">
          {request.studentName} × {request.tutor.name}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          Diajukan {request.parentName} (wali) · {stamp(request.submittedAt)}
        </p>
      </div>

      {/*
       * Mobile: ditumpuk. Desktop: Perubahan + cek bentrok di kolom kiri,
       * Persetujuan pihak terkait 420px di kanan.
       */}
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-x-ns-4xl lg:gap-y-ns-l">
        <Card size="compact" className="lg:col-start-1 lg:row-start-1">
          <CardHeader>
            <CardTitle>Perubahan</CardTitle>
          </CardHeader>
          <CardContent className="gap-ns-m flex flex-col">
            <dl className="gap-ns-m flex flex-col">
              <SummaryRow label="Dari" labelClassName="w-[104px]">
                {fromSession.day}, {formatRange(fromSession)} ({request.subject}
                )
              </SummaryRow>
              <SummaryRow label="Menjadi" labelClassName="w-[104px]">
                {toSession.day}, {formatRange(toSession)}
              </SummaryRow>
              <SummaryRow label="Berlaku" labelClassName="w-[104px]">
                {scope}
              </SummaryRow>
            </dl>
            <p className="text-subtitle text-grayscale-text-body leading-normal">
              “{request.reason}”
            </p>
          </CardContent>
        </Card>

        {conflict ? (
          <AlertBanner
            className="lg:col-start-1 lg:row-start-2"
            status="error"
            title="Jadwal baru bentrok"
            description={
              conflict.with === "tutor"
                ? `${tutorShort} mengajar ${conflict.other.studentName} setiap ${conflict.other.day} ${formatRange(conflict.other)}. Slot kosong: ${suggestFreeSlot(conflict.other)}. Tolak pengajuan dan tawarkan jam lain ke wali.`
                : `${student} sudah les ${conflict.other.day} ${formatRange(conflict.other)}. Tolak pengajuan dan tawarkan jam lain ke wali.`
            }
          />
        ) : (
          <AlertBanner
            className="lg:col-start-1 lg:row-start-2"
            status="success"
            title="Tidak bentrok"
            description={`${toSession.day} ${formatRange(toSession)} kosong untuk ${tutorShort} dan ${student}.`}
          />
        )}

        <fieldset
          className="gap-ns-m flex flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1"
          aria-describedby="consent-help"
          disabled={!!conflict}
        >
          <legend className="mb-ns-2xs text-body text-grayscale-text-title leading-normal font-bold">
            Persetujuan pihak terkait <span className="text-error">*</span>
          </legend>
          <p
            id="consent-help"
            className={
              showConsentError && !consented
                ? "text-caption text-error leading-normal"
                : "text-caption text-grayscale-text-caption leading-normal"
            }
            role={showConsentError && !consented ? "alert" : undefined}
          >
            {showConsentError && !consented
              ? "Centang keduanya setelah wali dan tutor mengonfirmasi."
              : "Catat setelah dikonfirmasi. Jadwal baru berlaku jika keduanya setuju."}
          </p>
          <div className="flex flex-col *:min-h-12">
            <Checkbox
              checked={parentAgreed}
              onCheckedChange={(v) => setParentAgreed(v === true)}
              label={`Wali (${request.parentName}) menyetujui`}
            />
            <Checkbox
              checked={tutorAgreed}
              onCheckedChange={(v) => setTutorAgreed(v === true)}
              label={`Tutor (${tutorShort}) menyetujui`}
            />
          </div>
        </fieldset>
      </div>

      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        tone="destructive"
        title="Tolak pengajuan perubahan?"
        description={`Jadwal ${request.subject} ${student} tetap ${fromSession.day}, ${formatRange(fromSession)}. ${request.parentName} akan menerima notifikasi.`}
        confirmLabel="Tolak Pengajuan"
        onConfirm={async () => {
          await decide.mutateAsync(false).catch(() => undefined)
        }}
      />
    </DetailScreen>
  )
}

export { TinjauPengajuan }
