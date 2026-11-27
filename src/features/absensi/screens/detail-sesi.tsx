import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataState,
  toast,
} from "@/components"
import {
  approveSession,
  NotFoundError,
  sessionQuery,
} from "@/features/absensi/api"
import type { AttendanceSession } from "@/types/absensi"
import { NotesCard, ReviewCard } from "@/features/absensi/components"
import { formatSessionTitle } from "@/features/absensi/lib"
import { SummaryRow } from "@/features/pendaftaran/components"
import { formatTimeRange } from "@/lib/format"

/*
 * W5 · Validasi Absensi / Detail sesi
 *
 * Kartu sesi (judul, jam, badge, Tutor · Kehadiran tutor · Kehadiran siswa
 * · Materi) dan kartu "Catatan & Dokumentasi" (catatan + lampiran).
 * Bilah aksi sesuai status:
 *   belum_divalidasi → Ajukan Keberatan (Secondary) · Setujui Kehadiran
 *   sudah_divalidasi tanpa ulasan → Beri Ulasan (Secondary)
 *   keberatan → tanpa aksi, banner "Keberatan sedang ditinjau"
 *
 * Desktop (≥ lg, frame "Detail sesi (Desktop)"): Page header (kembali
 * "Validasi Absensi", judul "Detail Sesi") dengan tombol aksi di kanan;
 * kartu sesi dan "Catatan & Dokumentasi" berdampingan (gap 24, sama tinggi).
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
    <DetailScreen
      title="Detail Sesi"
      footer={footer}
      desktopHeader="page"
      backLabel="Validasi Absensi"
      desktopWidth="wide"
      desktopActions="header"
      className="lg:pt-ns-3xl"
    >
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
          <div className="contents lg:grid lg:grid-cols-2 lg:gap-ns-2xl">
            <SessionCard session={session} />
            <NotesCard session={session} />
            {session.review && <ReviewCard review={session.review} />}
          </div>
        </>
      ) : null}
    </DetailScreen>
  )
}

function SessionCard({ session }: { session: AttendanceSession }) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>
          {formatSessionTitle(session.subject, session.start)}
        </CardTitle>
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
