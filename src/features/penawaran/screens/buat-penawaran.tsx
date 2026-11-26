import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Navigate, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldLabel,
  Textarea,
  toast,
} from "@/components"
import {
  chooseAnotherTutor,
  offerDraftQuery,
  OfferError,
  offerQuery,
  sendOffer,
} from "@/features/penawaran/api"
import type { OfferDraft } from "@/types/penawaran"
import { OfferSummaryCard } from "@/features/penawaran/components"
import { firstName } from "@/lib/format"
import { NotFoundError } from "@/features/verifikasi/api"

/*
 * P4 · Buat Penawaran · Figma "Penawaran / Buat penawaran" dan
 * "/ Error - Tutor tidak tersedia".
 *
 * Ringkasan penawaran (siswa, tutor, mapel, jadwal, lokasi · jarak, tarif)
 * → Pesan untuk tutor (opsional, maks. 500) → Kirim Penawaran. Bila slot
 * tutor ternyata sudah terisi: banner error + "Pilih Tutor Lain" (pilihan
 * tutor dilepas, kembali ke kandidat P3).
 */
const LES = "/pengelola/les"
const MESSAGE_MAX = 500

function BuatPenawaran() {
  const { registrationId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(offerDraftQuery(registrationId))

  if (query.data) {
    return <OfferForm draft={query.data} />
  }

  const error = query.error
  if (
    error instanceof OfferError &&
    error.code === "already_sent" &&
    error.offerId
  ) {
    return <Navigate to={`${LES}/penawaran/${error.offerId}`} replace />
  }

  return (
    <DetailScreen title="Buat Penawaran">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Menyiapkan penawaran…" />
      ) : error instanceof NotFoundError ||
        (error instanceof OfferError && error.code === "no_match") ? (
        <DataState
          state="empty"
          title={
            error instanceof NotFoundError
              ? "Pendaftaran tidak ditemukan"
              : "Belum ada tutor yang dipilih"
          }
          description="Pilih tutor untuk siswa ini di tab Pencocokan terlebih dahulu."
          action={{
            label: "Kembali ke Les",
            onClick: () => navigate(LES, { replace: true }),
          }}
        />
      ) : (
        <DataState
          state="error"
          title="Penawaran gagal disiapkan"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      )}
    </DetailScreen>
  )
}

function OfferForm({ draft }: { draft: OfferDraft }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = React.useState("")
  /* Diisi setelah server menolak karena slot tutor sudah terisi */
  const [unavailable, setUnavailable] = React.useState<string | null>(null)

  const send = useMutation({
    mutationFn: () => sendOffer(draft.registrationId, message),
    networkMode: "always",
    onSuccess: (offer) => {
      queryClient.setQueryData(offerQuery(offer.id).queryKey, offer)
      void queryClient.invalidateQueries({ queryKey: ["penawaran"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Penawaran terkirim", {
        description: `Notifikasi terkirim ke ${offer.tutor.shortName}.`,
      })
      navigate(`${LES}/penawaran/${offer.id}`, { replace: true })
    },
    onError: (error) => {
      if (error instanceof OfferError && error.code === "tutor_unavailable") {
        setUnavailable(draft.takenSlot ?? draft.schedule)
        return
      }
      toast.error("Penawaran gagal dikirim", {
        description:
          "Pesan Anda tetap tersimpan. Periksa koneksi lalu coba lagi.",
      })
    },
  })

  const pickAnother = useMutation({
    mutationFn: () => chooseAnotherTutor(draft.registrationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pencocokan"] })
      void queryClient.invalidateQueries({ queryKey: ["penawaran"] })
      void queryClient.invalidateQueries({ queryKey: ["verifikasi"] })
      navigate(`${LES}/pencocokan/${draft.registrationId}`, { replace: true })
    },
    onError: () =>
      toast.error("Gagal kembali ke kandidat", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      }),
  })

  return (
    <DetailScreen
      title="Buat Penawaran"
      footer={
        unavailable ? (
          <Button
            onClick={() => pickAnother.mutate()}
            disabled={pickAnother.isPending}
          >
            Pilih Tutor Lain
          </Button>
        ) : (
          <Button onClick={() => send.mutate()} disabled={send.isPending}>
            {send.isPending ? "Mengirim…" : "Kirim Penawaran"}
          </Button>
        )
      }
    >
      {unavailable && (
        <AlertBanner
          status="error"
          title={`${draft.tutor.shortName} tidak lagi tersedia`}
          description={`Slot ${unavailable} baru saja terisi siswa lain. Pilih tutor lain dari hasil pencocokan.`}
          action={{
            label: "Kembali ke kandidat",
            onClick: () => pickAnother.mutate(),
          }}
        />
      )}

      <OfferSummaryCard offer={draft} />

      <Field>
        <FieldLabel htmlFor="offer-message">Pesan untuk tutor</FieldLabel>
        <Textarea
          id="offer-message"
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Contoh: ${firstName(draft.student.name)} sedang persiapan ujian, mohon fokus pada latihan soal.`}
          aria-describedby="offer-message-help"
        />
        <FieldDescription
          id="offer-message-help"
          counter={`${message.length}/${MESSAGE_MAX}`}
        >
          Opsional. Ikut terkirim bersama notifikasi penawaran.
        </FieldDescription>
      </Field>

      <p className="text-caption text-grayscale-text-caption leading-normal">
        Setelah tutor menjawab, catat tanggapannya di halaman detail penawaran.
      </p>
    </DetailScreen>
  )
}

export { BuatPenawaran }
