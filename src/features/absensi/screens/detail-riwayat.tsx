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
import {
  NotFoundError,
  sessionQuery,
  type Attendance,
  type AttendanceSession,
} from "@/features/absensi/api"
import { NotesCard, ReviewCard } from "@/features/absensi/components"
import { SummaryRow } from "@/features/pendaftaran/components"
import { formatTimeRange } from "@/lib/format/date"

/*
 * W7 · Riwayat Les / Wali - Detail sesi (hanya baca)
 *
 * Kartu sesi (judul hari lengkap, jam · tutor, badge, Kehadiran · Materi,
 * label 104px) · "Catatan tutor" · "Ulasan Anda" bila ada. Sesi yang belum
 * divalidasi menampilkan banner dengan tautan ke layar validasi (W5).
 */
const attendanceText = (who: string, value: Attendance) =>
  `${who} ${value === "Tidak hadir" ? "tidak hadir" : value.toLowerCase()}`

function DetailRiwayat() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(sessionQuery(sessionId))
  const session = query.data

  return (
    <DetailScreen title="Detail Sesi">
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
          <SessionSummary session={session} />
          {!session.cancelReason && (
            <NotesCard session={session} title="Catatan tutor" />
          )}
          {session.review && <ReviewCard review={session.review} />}
        </>
      ) : null}
    </DetailScreen>
  )
}

function SessionSummary({ session }: { session: AttendanceSession }) {
  return (
    <Card size="compact">
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
