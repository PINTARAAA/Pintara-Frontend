import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
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
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import {
  NotFoundError,
  tutorSessionQuery,
  type TutorSession,
} from "@/features/presensi/api/presensi"
import { formatLongDate, sessionTitle } from "@/features/presensi/lib/format"
import { formatTimeRange } from "@/lib/format/date"

/*
 * T3 · Detail Presensi · Figma "Status Presensi / Detail - Keberatan" dan
 * "Detail - Menunggu wali".
 *
 * Kartu judul (sesi, tanggal · jadwal, badge) · [Keberatan dari wali] ·
 * Progres presensi (Timeline) · Data yang Anda isi · catatan. Bila ada
 * keberatan: bilah aksi "Hubungi Pengelola LBB" (WhatsApp).
 */
const LBB_WHATSAPP = "6281200001122"

/* "19 Nov, 20.15" */
const stamp = (date: Date) => format(date, "d MMM, HH.mm", { locale: localeId })

function DetailPresensi() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(tutorSessionQuery(sessionId))
  const session = query.data
  const record = session?.record

  return (
    <DetailScreen
      title="Detail Presensi"
      footer={
        record?.validation === "keberatan" && (
          <Button
            variant="secondary"
            nativeButton={false}
            render={
              <a
                href={`https://wa.me/${LBB_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Hubungi Pengelola LBB
          </Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat presensi…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Presensi tidak ditemukan"
            description="Sesi ini mungkin sudah dihapus dari jadwal."
            action={{
              label: "Kembali ke Status Presensi",
              onClick: () => navigate("/tutor/presensi/status", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Presensi gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : session && !record ? (
        <DataState
          state="empty"
          title="Presensi belum dikumpulkan"
          description="Isi presensi sesi ini terlebih dahulu."
          action={{
            label: "Isi Presensi",
            onClick: () => navigate(`/tutor/presensi/${session.id}`, { replace: true }),
          }}
        />
      ) : session && record ? (
        <>
          <Card size="compact">
            <CardHeader>
              <CardTitle>{sessionTitle(session)}</CardTitle>
              <p className="text-caption leading-normal text-grayscale-text-caption">
                {formatLongDate(session.start)} ·{" "}
                {formatTimeRange(session.start, session.end)}
              </p>
            </CardHeader>
            <CardContent>
              <StatusBadge category="presensi" status={record.validation} />
            </CardContent>
          </Card>

          {record.objection && (
            <Card size="compact">
              <CardHeader>
                <CardTitle>Keberatan dari wali</CardTitle>
                <CardDescription>
                  {session.student.parentSalutation} {session.student.parentName} ·{" "}
                  {stamp(record.objection.at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <blockquote>“{record.objection.reason}”</blockquote>
              </CardContent>
            </Card>
          )}

          <ProgressCard session={session} />
          <FilledDataCard session={session} />

          {record.validation === "keberatan" && (
            <p className="text-caption leading-normal text-grayscale-text-caption">
              Anda tidak perlu mengubah presensi. Hubungi Pengelola LBB bila
              ingin memberi klarifikasi.
            </p>
          )}
        </>
      ) : null}
    </DetailScreen>
  )
}

function ProgressCard({ session }: { session: TutorSession }) {
  const record = session.record!
  const parent = `${session.student.parentSalutation} ${session.student.parentName}`

  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Progres presensi</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline aria-label="Progres presensi">
          <TimelineItem
            state="done"
            title="Presensi dikumpulkan"
            description="Anda mengisi presensi sesi ini."
            timestamp={stamp(record.submittedAt)}
          />
          {record.validation === "keberatan" ? (
            <>
              <TimelineItem
                state="rejected"
                title="Dikeberatan wali"
                description="Wali murid tidak menyetujui data kehadiran."
                timestamp={record.objection && stamp(record.objection.at)}
              />
              <TimelineItem
                state="current"
                title="Ditinjau Pengelola LBB"
                description="Pengelola akan mengoreksi atau menetapkan presensi."
              />
            </>
          ) : record.validation === "belum_divalidasi" ? (
            <>
              <TimelineItem
                state="current"
                title="Menunggu validasi wali"
                description={`${parent} belum memeriksa sesi ini.`}
              />
              <TimelineItem
                state="upcoming"
                title="Verifikasi Pengelola LBB"
                description="Pemeriksaan akhir sebelum rekap."
              />
            </>
          ) : (
            <>
              <TimelineItem
                state="done"
                title="Divalidasi wali"
                description={`${parent} menyetujui data kehadiran.`}
                timestamp={record.validatedAt && stamp(record.validatedAt)}
              />
              <TimelineItem
                state="done"
                title="Verifikasi Pengelola LBB"
                description="Presensi sudah diverifikasi final."
              />
            </>
          )}
          <TimelineItem
            state={record.validation === "sudah_divalidasi" ? "done" : "upcoming"}
            title="Masuk rekap honor"
            description={
              !record.held
                ? "Sesi tidak terlaksana tidak dihitung dalam honor."
                : record.validation === "sudah_divalidasi"
                  ? "Sesi ini dihitung dalam rekap honor bulan ini."
                  : "Dihitung setelah presensi diverifikasi final."
            }
          />
        </Timeline>
      </CardContent>
    </Card>
  )
}

function FilledDataCard({ session }: { session: TutorSession }) {
  const record = session.record!
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Data yang Anda isi</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-ns-m">
          {record.held ? (
            <>
              <SummaryRow label="Waktu tercatat">
                {record.actualStart}–{record.actualEnd}
              </SummaryRow>
              <SummaryRow label="Kehadiran siswa">
                {record.studentPresent ? "Hadir" : "Tidak hadir"}
              </SummaryRow>
              <SummaryRow label="Materi">{record.topic}</SummaryRow>
              {record.notes && <SummaryRow label="Catatan">{record.notes}</SummaryRow>}
              {record.attachment && (
                <SummaryRow label="Dokumentasi">{record.attachment.name}</SummaryRow>
              )}
            </>
          ) : (
            <>
              <SummaryRow label="Status sesi">Tidak terlaksana</SummaryRow>
              <SummaryRow label="Alasan">{record.cancelReason}</SummaryRow>
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

export { DetailPresensi }
