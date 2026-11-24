import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
  NotesCard,
  ReviewCard,
} from "@/features/absensi/components/session-cards"
import { formatSessionTitle } from "@/features/absensi/lib/format"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import { formatTimeRange } from "@/lib/format/date"

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

export { DetailSesi }
