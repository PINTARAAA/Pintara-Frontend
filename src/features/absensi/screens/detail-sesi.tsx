import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PaperclipIcon, StarIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { AlertBanner } from "@/components/ui/alert-banner"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/ui/data-state"
import { toast } from "@/components/ui/toast-api"
import {
  approveSession,
  NotFoundError,
  sessionQuery,
  type AttendanceSession,
} from "@/features/absensi/api/absensi"
import {
  formatSessionTitle,
  RATING_LABELS,
} from "@/features/absensi/lib/format"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import { formatDateTime, formatTimeRange } from "@/lib/format/date"

/*
 * W5 · Validasi Absensi / Detail sesi
 *
 * Kartu sesi (judul, jam, badge, Tutor · Kehadiran tutor · Kehadiran siswa
 * · Materi) dan kartu "Catatan & Dokumentasi" (catatan + lampiran).
 * Bilah aksi sesuai status:
 *   belum_divalidasi → Ajukan Keberatan (Secondary) · Setujui Kehadiran
 *   sudah_divalidasi tanpa ulasan → Beri Ulasan (Secondary)
 *   keberatan → tanpa aksi, banner "Keberatan sedang ditinjau"
 */
function DetailSesi() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(sessionQuery(sessionId))
  const session = query.data

  const approve = useMutation({
    mutationFn: () => approveSession(sessionId),
    networkMode: "always",
    onSuccess: (updated) => {
      /* Isi cache langsung agar layar ulasan tidak menampilkan status lama */
      queryClient.setQueryData(sessionQuery(sessionId).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ["absensi", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate(`/wali/absensi/${sessionId}/ulasan`, { replace: true })
    },
    onError: () =>
      toast.error("Kehadiran gagal disetujui", {
        description: "Periksa koneksi lalu coba lagi.",
      }),
  })

  const footer =
    session?.status === "belum_divalidasi" ? (
      <>
        <Button
          variant="secondary"
          nativeButton={false}
          render={<Link to={`/wali/absensi/${session.id}/keberatan`} />}
        >
          Ajukan Keberatan
        </Button>
        <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
          {approve.isPending ? "Menyimpan…" : "Setujui Kehadiran"}
        </Button>
      </>
    ) : session?.status === "sudah_divalidasi" && !session.review ? (
      <Button
        variant="secondary"
        nativeButton={false}
        render={<Link to={`/wali/absensi/${session.id}/ulasan`} />}
      >
        Beri Ulasan
      </Button>
    ) : undefined

  return (
    <DetailScreen title="Detail Sesi" footer={footer}>
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat sesi…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Sesi tidak ditemukan"
            description="Sesi ini mungkin sudah tidak tersedia."
            action={{
              label: "Kembali ke Absensi",
              onClick: () => navigate("/wali/absensi", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Sesi gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : session ? (
        <>
          {session.status === "keberatan" && session.objection && (
            <AlertBanner
              status="warning"
              title="Keberatan sedang ditinjau"
              description={`Pengelola LBB akan meninjau keberatan Anda sebelum presensi diverifikasi. Alasan: ${session.objection.reason}`}
            />
          )}
          <SessionCard session={session} />
          <NotesCard session={session} />
          {session.review && <ReviewCard review={session.review} />}
        </>
      ) : null}
    </DetailScreen>
  )
}

function SessionCard({ session }: { session: AttendanceSession }) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>{formatSessionTitle(session.subject, session.start)}</CardTitle>
        <CardDescription>
          {formatTimeRange(session.start, session.end)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBadge category="presensi" status={session.status} />
        <dl className="flex flex-col gap-ns-m">
          <SummaryRow label="Tutor">{session.tutor.name}</SummaryRow>
          <SummaryRow label="Kehadiran tutor">
            {session.tutorAttendance}
          </SummaryRow>
          <SummaryRow label="Kehadiran siswa">
            {session.studentAttendance}
          </SummaryRow>
          <SummaryRow label="Materi">{session.topic}</SummaryRow>
        </dl>
      </CardContent>
    </Card>
  )
}

function NotesCard({ session }: { session: AttendanceSession }) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Catatan &amp; Dokumentasi</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{session.notes || "Tutor tidak menambahkan catatan."}</p>
        {session.attachments.length > 0 && (
          <ul className="flex flex-col gap-ns-m" aria-label="Lampiran">
            {session.attachments.map((file) => (
              <li
                key={file}
                className="flex items-center gap-ns-s rounded-md bg-grayscale-surface-subtitle px-ns-m py-ns-s text-caption text-grayscale-text-body"
              >
                <PaperclipIcon aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{file}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/* Ulasan yang sudah dikirim (riwayat) */
function ReviewCard({
  review,
}: {
  review: NonNullable<AttendanceSession["review"]>
}) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Ulasan Anda</CardTitle>
        <CardDescription>Dikirim {formatDateTime(review.submittedAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-ns-s">
          <span
            className="flex gap-ns-2xs"
            role="img"
            aria-label={`${review.rating} dari 5 bintang`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon
                key={i}
                aria-hidden="true"
                strokeWidth={2}
                className={
                  i < review.rating
                    ? "size-5 fill-warning text-warning"
                    : "size-5 text-grayscale-text-body"
                }
              />
            ))}
          </span>
          <span className="font-bold text-grayscale-text-title">
            {RATING_LABELS[review.rating - 1]}
          </span>
        </div>
        {review.comment && <p>{review.comment}</p>}
      </CardContent>
    </Card>
  )
}

export { DetailSesi }
