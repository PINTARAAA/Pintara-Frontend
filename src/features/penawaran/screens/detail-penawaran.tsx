import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  ResultScreen,
  RESULT_BUTTON_DESKTOP,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  Timeline,
  TimelineItem,
  toast,
} from "@/components"
import {
  declineLabel,
  OfferError,
  offerQuery,
  recordAccepted,
} from "@/features/penawaran/api"
import type { Offer } from "@/types/penawaran"
import {
  OfferSummaryCard,
  ResultOfferCard,
} from "@/features/penawaran/components"
import { getErrorMessage } from "@/lib/api"
import { firstName } from "@/lib/format"
import { isNotFoundError } from "@/features/verifikasi/api"

/*
 * P4 · Detail Penawaran · Figma "Penawaran / Detail - Menunggu" dan
 * "Penawaran / Diterima".
 *
 * Kartu judul (siswa × tutor, waktu kirim, badge) → Progres penugasan
 * (Timeline) → Ringkasan penawaran → [Pesan untuk tutor]. Bilah aksi:
 *   menunggu : Catat Ditolak (→ form) · Catat Diterima (→ layar hasil)
 *   diterima : Atur Jadwal Les (P5 · form jadwal untuk penawaran ini)
 *   ditolak  : Cari Tutor Lain (P3)
 *
 * Desktop (Figma "Penawaran / Detail - Menunggu (Desktop)" dan "/ Diterima
 * (Desktop)"): Page header "← Les" dengan tombol aksi di kanan; kartu judul
 * selebar konten, lalu Ringkasan (+ Pesan) di kiri dan Progres penugasan
 * 420px di kanan. Layar hasil diterima: Page header "Penawaran".
 */
const LES = "/pengelola/les"
const stamp = (date: Date) => format(date, "d MMM, HH.mm", { locale: localeId })
const stampLong = (date: Date) =>
  format(date, "d MMM yyyy, HH.mm", { locale: localeId })

function DetailPenawaran() {
  const { offerId = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(offerQuery(offerId))
  const offer = query.data
  const [accepted, setAccepted] = React.useState<Offer | null>(null)

  const accept = useMutation({
    mutationFn: () => recordAccepted(offerId),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(offerQuery(offerId).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ["penawaran", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setAccepted(updated)
    },
    onError: (error) => {
      if (error instanceof OfferError && error.code === "already_answered") {
        toast.error("Jawaban tutor sudah dicatat", {
          description: "Status terbaru ditampilkan.",
        })
        void query.refetch()
        return
      }
      toast.error("Jawaban gagal dicatat", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      })
    },
  })

  if (accepted) {
    return <AcceptedResult offer={accepted} />
  }

  return (
    <DetailScreen
      title="Detail Penawaran"
      backLabel="Les"
      desktopHeader="page"
      desktopActions="header"
      desktopWidth="wide"
      footer={
        offer && (
          <Actions
            offer={offer}
            onAccept={() => accept.mutate()}
            accepting={accept.isPending}
          />
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat penawaran…" />
      ) : query.isError ? (
        isNotFoundError(query.error) ? (
          <DataState
            state="empty"
            title="Penawaran tidak ditemukan"
            description="Penawaran ini mungkin sudah dihapus."
            action={{
              label: "Kembali ke Penawaran",
              onClick: () =>
                navigate(`${LES}?tab=penawaran`, { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Penawaran gagal dimuat"
            description={getErrorMessage(query.error)}
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : offer ? (
        <>
          <section
            aria-label="Status penawaran"
            className="gap-ns-s border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col items-start rounded-(--comp-radius-md) border leading-normal"
          >
            <h2 className="text-body text-grayscale-text-title font-bold">
              {offer.student.name} × {offer.tutor.name}
            </h2>
            <p className="text-caption text-grayscale-text-caption">
              Dikirim {stampLong(offer.sentAt)}
            </p>
            <StatusBadge category="penawaran_tutor" status={offer.status} />
          </section>

          {/*
           * Mobile: Progres → Ringkasan → Pesan (ditumpuk).
           * Desktop: Ringkasan + Pesan di kolom kiri, Progres 420px di kanan.
           */}
          <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-ns-2xl">
            <Card
              size="compact"
              className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
            >
              <CardHeader>
                <CardTitle>Progres penugasan</CardTitle>
              </CardHeader>
              <CardContent>
                <OfferTimeline offer={offer} />
              </CardContent>
            </Card>

            <OfferSummaryCard
              offer={offer}
              className="lg:col-start-1 lg:row-start-1"
            />

            {offer.message && (
              <Card size="compact" className="lg:col-start-1 lg:row-start-2">
                <CardHeader>
                  <CardTitle>Pesan untuk tutor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-subtitle text-grayscale-text-body leading-normal">
                    {offer.message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </DetailScreen>
  )
}

function OfferTimeline({ offer }: { offer: Offer }) {
  const sent = (
    <TimelineItem
      state="done"
      title="Penawaran dikirim"
      description={`Notifikasi terkirim ke ${offer.tutor.shortName}.`}
      timestamp={stamp(offer.sentAt)}
    />
  )

  if (offer.status === "diterima") {
    return (
      <Timeline aria-label="Progres penugasan">
        {sent}
        <TimelineItem
          state="done"
          title="Tutor menerima"
          description={`${offer.tutor.shortName} ditetapkan sebagai tutor ${firstName(offer.student.name)}.`}
          timestamp={offer.answeredAt && stamp(offer.answeredAt)}
        />
        <TimelineItem
          state="current"
          title="Atur jadwal les"
          description="Tentukan jadwal rutin dan pertemuan pertama."
        />
      </Timeline>
    )
  }

  if (offer.status === "ditolak") {
    return (
      <Timeline aria-label="Progres penugasan">
        {sent}
        <TimelineItem
          state="rejected"
          title="Tutor menolak"
          description={[
            offer.decline && declineLabel(offer.decline.reason),
            offer.decline?.note,
          ]
            .filter(Boolean)
            .join(". ")}
          timestamp={offer.answeredAt && stamp(offer.answeredAt)}
        />
        <TimelineItem
          state="current"
          title="Cari tutor lain"
          description={`${firstName(offer.student.name)} kembali ke daftar pencocokan.`}
        />
      </Timeline>
    )
  }

  return (
    <Timeline aria-label="Progres penugasan">
      {sent}
      <TimelineItem
        state="current"
        title="Menunggu jawaban tutor"
        description="Catat jawaban tutor di bawah setelah dikonfirmasi."
      />
      <TimelineItem
        state="upcoming"
        title="Atur jadwal les"
        description="Dilakukan setelah tutor menerima."
      />
    </Timeline>
  )
}

function Actions({
  offer,
  onAccept,
  accepting,
}: {
  offer: Offer
  onAccept: () => void
  accepting: boolean
}) {
  if (offer.status === "menunggu_konfirmasi") {
    return (
      <>
        <Button
          variant="secondary"
          nativeButton={false}
          render={<Link to={`${LES}/penawaran/${offer.id}/ditolak`} />}
        >
          Catat Ditolak
        </Button>
        <Button onClick={onAccept} disabled={accepting}>
          {accepting ? "Menyimpan…" : "Catat Diterima"}
        </Button>
      </>
    )
  }
  if (offer.status === "diterima") {
    return (
      <Button
        nativeButton={false}
        render={<Link to={`${LES}/jadwal/atur/${offer.id}`} />}
      >
        Atur Jadwal Les
      </Button>
    )
  }
  return (
    <Button
      nativeButton={false}
      render={<Link to={`${LES}/pencocokan/${offer.registrationId}`} />}
    >
      Cari Tutor Lain
    </Button>
  )
}

/* "Penawaran / Diterima" */
function AcceptedResult({ offer }: { offer: Offer }) {
  const navigate = useNavigate()
  return (
    <ResultScreen
      pageTitle="Penawaran"
      title={`${offer.tutor.shortName} menerima penawaran`}
      description={`Tutor sudah ditetapkan untuk ${firstName(offer.student.name)}. Lanjutkan dengan mengatur jadwal les.`}
      footer={
        <>
          <Button
            size="lg"
            className={RESULT_BUTTON_DESKTOP}
            nativeButton={false}
            render={<Link to={`${LES}/jadwal/atur/${offer.id}`} replace />}
          >
            Atur Jadwal Les
          </Button>
          <Button
            variant="tertiary"
            onClick={() => navigate(`${LES}?tab=penawaran`, { replace: true })}
          >
            Nanti saja
          </Button>
        </>
      }
    >
      <ResultOfferCard offer={offer} />
    </ResultScreen>
  )
}

export { DetailPenawaran }
