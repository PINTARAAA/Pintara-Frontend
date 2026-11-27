import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  StatusBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataState,
} from "@/components"
import { NotFoundError, sessionQuery } from "@/features/absensi/api"
import type { Attendance, AttendanceSession } from "@/types/absensi"
import { NotesCard, ReviewCard } from "@/features/absensi/components"
import { SummaryRow } from "@/features/pendaftaran/components"
import { formatTimeRange } from "@/lib/format"

/*
 * W7 · Riwayat Les / Wali - Detail sesi (hanya baca)
 *
 * Kartu sesi (judul hari lengkap, jam · tutor, badge, Kehadiran · Materi,
 * label 104px) · "Catatan tutor" · "Ulasan Anda" bila ada. Sesi yang belum
 * divalidasi menampilkan banner dengan tautan ke layar validasi (W5).
 *
 * Desktop (≥ lg, frame "Riwayat Les / Wali - Detail sesi (Desktop)"):
 * halaman putih, Page header (kembali "Riwayat Les", judul "Detail Sesi");
 * kartu sesi + "Catatan tutor" di kolom utama (gap 24), "Ulasan Anda" 380px
 * di kanan (jarak 32).
 */
const attendanceText = (who: string, value: Attendance) =>
  `${who} ${value === "Tidak hadir" ? "tidak hadir" : value.toLowerCase()}`

function DetailRiwayat() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(sessionQuery(sessionId))
  const session = query.data

  return (
    <DetailScreen
      title="Detail Sesi"
      desktopHeader="page"
      backLabel="Riwayat Les"
      desktopWidth="wide"
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
              label: "Kembali ke Riwayat Les",
              onClick: () => navigate("/wali/riwayat", { replace: true }),
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
          {!session.cancelReason && session.status === "belum_divalidasi" && (
            <AlertBanner
              status="warning"
              title="Sesi ini belum Anda validasi"
              description="Periksa kehadiran agar sesi dihitung pada rekap honor tutor."
              action={{
                label: "Validasi sekarang",
                onClick: () => navigate(`/wali/absensi/${session.id}`),
              }}
            />
          )}
          <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-ns-3xl lg:gap-y-ns-2xl">
            <SessionSummary
              session={session}
              className="lg:col-start-1 lg:row-start-1"
            />
            {!session.cancelReason && (
              <NotesCard
                session={session}
                title="Catatan tutor"
                className="lg:col-start-1 lg:row-start-2"
              />
            )}
            {session.review && (
              <ReviewCard
                review={session.review}
                className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
              />
            )}
          </div>
        </>
      ) : null}
    </DetailScreen>
  )
}

function SessionSummary({
  session,
  className,
}: {
  session: AttendanceSession
  className?: string
}) {
  return (
    <Card size="compact" className={className}>
      <CardHeader>
        <CardTitle>
          {session.subject} ·{" "}
          {format(session.start, "EEEE, d MMM yyyy", { locale: localeId })}
        </CardTitle>
        <CardDescription>
          {formatTimeRange(session.start, session.end)} · {session.tutor.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {session.cancelReason ? (
          <p className="text-grayscale-text-body">
            Sesi tidak terlaksana · {session.cancelReason}.
          </p>
        ) : (
          <StatusBadge category="presensi" status={session.status} />
        )}
        <dl className="flex flex-col gap-ns-m">
          <SummaryRow label="Kehadiran" labelClassName="w-[104px]">
            {attendanceText("Siswa", session.studentAttendance)} ·{" "}
            {attendanceText("tutor", session.tutorAttendance)}
          </SummaryRow>
          <SummaryRow label="Materi" labelClassName="w-[104px]">
            {session.topic}
          </SummaryRow>
        </dl>
      </CardContent>
    </Card>
  )
}

export { DetailRiwayat }
