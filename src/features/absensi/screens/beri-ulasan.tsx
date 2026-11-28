import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Rating,
  Textarea,
  toast,
} from "@/components"
import {
  isNotFoundError,
  sessionQuery,
  submitReview,
} from "@/features/absensi/api"
import type { AttendanceSession } from "@/types/absensi"
import { formatSessionTitle, RATING_LABELS } from "@/features/absensi/lib"
import { InitialsAvatar } from "@/features/dashboard/components"
import { getErrorMessage } from "@/lib/api"

/*
 * W5 · Validasi Absensi / Rating & ulasan ("Beri Ulasan")
 *
 * Dibuka setelah "Setujui Kehadiran" (atau dari Detail Sesi). Banner sukses
 * · avatar tutor 64px · pertanyaan · Rating 5 bintang + label · Textarea
 * "Ulasan" opsional. Bilah aksi: Lewati (Tertiary) · Kirim Ulasan.
 *
 * Desktop (≥ lg, frame "Rating & ulasan (Desktop)"): Page header (kembali
 * "Detail Sesi"), kolom 720px gap 24; tombol rata kanan di bawah garis.
 */
const COMMENT_MAX = 500

function BeriUlasan() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(sessionQuery(sessionId))
  const session = query.data

  if (session?.status === "sudah_divalidasi" && !session.review) {
    return <ReviewForm session={session} />
  }

  return (
    <DetailScreen
      title="Beri Ulasan"
      desktopHeader="page"
      backLabel="Detail Sesi"
      desktopWidth="wide"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat sesi…" />
      ) : query.isError && !isNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Sesi gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Sesi tidak ditemukan"
              : session?.review
                ? "Ulasan sudah dikirim"
                : "Sesi belum divalidasi"
          }
          description="Ulasan bisa diberikan satu kali setelah kehadiran disetujui."
          action={{
            label: "Kembali ke Absensi",
            onClick: () => navigate("/wali/absensi", { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

function ReviewForm({ session }: { session: AttendanceSession }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rating, setRating] = React.useState(0)
  const [comment, setComment] = React.useState("")
  const [ratingError, setRatingError] = React.useState(false)

  const submit = useMutation({
    mutationFn: () => submitReview(session.id, { rating, comment }),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(sessionQuery(session.id).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ["absensi", "daftar"] })
      toast.success("Ulasan terkirim", {
        description: "Terima kasih atas masukan Anda.",
      })
      navigate("/wali/absensi", { replace: true })
    },
    onError: (error) =>
      toast.error("Ulasan gagal dikirim", {
        description: getErrorMessage(error),
      }),
  })

  const handleSubmit = () => {
    if (rating === 0) {
      setRatingError(true)
      return
    }
    submit.mutate()
  }

  const day = format(session.start, "d MMM", { locale: localeId })

  const actions = (
    <>
      <Button
        variant="tertiary"
        onClick={() => navigate("/wali/absensi", { replace: true })}
      >
        Lewati
      </Button>
      <Button onClick={handleSubmit} disabled={submit.isPending}>
        {submit.isPending ? "Mengirim…" : "Kirim Ulasan"}
      </Button>
    </>
  )

  return (
    <DetailScreen
      title="Beri Ulasan"
      surface="default"
      desktopHeader="page"
      backLabel="Detail Sesi"
      desktopWidth="wide"
      desktopActions="none"
      className="gap-ns-2xl lg:pt-ns-3xl"
      footer={actions}
    >
      <div className="contents lg:flex lg:max-w-180 lg:flex-col lg:gap-ns-2xl">
        <AlertBanner
          status="success"
          title="Kehadiran disetujui"
          description={`Terima kasih. Sesi ${session.subject} ${day} telah divalidasi.`}
        />

        <div className="flex flex-col items-center gap-ns-s text-center leading-normal">
          <InitialsAvatar
            initials={session.tutor.initials}
            className="size-16 text-body"
          />
          <h2 className="text-body font-bold text-grayscale-text-title">
            Bagaimana sesi bersama {session.tutor.name}?
          </h2>
          <p className="text-caption text-grayscale-text-caption">
            {formatSessionTitle(session.subject, session.start)}
          </p>
          <Rating
            value={rating}
            onValueChange={(n) => {
              setRating(n)
              setRatingError(false)
            }}
            labels={RATING_LABELS}
            invalid={ratingError}
            aria-label="Rating sesi"
            aria-describedby={ratingError ? "rating-error" : undefined}
          />
          {rating > 0 ? (
            <p
              aria-live="polite"
              className="text-subtitle font-bold text-grayscale-text-title"
            >
              {RATING_LABELS[rating - 1]}
            </p>
          ) : ratingError ? (
            <FieldError id="rating-error" className="text-center">
              Pilih rating terlebih dahulu.
            </FieldError>
          ) : (
            <p className="text-caption text-grayscale-text-caption">
              Ketuk bintang untuk memberi nilai.
            </p>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="comment">Ulasan</FieldLabel>
          <Textarea
            id="comment"
            maxLength={COMMENT_MAX}
            placeholder="Ceritakan pengalaman belajar dengan tutor"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <FieldDescription counter={`${comment.length}/${COMMENT_MAX}`}>
            Opsional. Ulasan membantu LBB menjaga kualitas tutor.
          </FieldDescription>
        </Field>

        <div className="hidden justify-end gap-ns-m border-t border-grayscale-border-default pt-ns-2xl lg:flex">
          {actions}
        </div>
      </div>
    </DetailScreen>
  )
}

export { BeriUlasan }
