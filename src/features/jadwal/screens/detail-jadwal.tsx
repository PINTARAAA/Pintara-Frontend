import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
} from "@/components"
import {
  formatTimeSlot,
  NotFoundError,
  routineQuery,
  WEEKDAYS,
} from "@/features/jadwal/api"
import { formatChangeTitle } from "@/features/jadwal/lib"
import { SummaryRow } from "@/features/pendaftaran/components"
import { formatDate } from "@/lib/format/date"

/*
 * W4 · Jadwal Les / Detail · kartu judul (mapel · hari, jam · sejak),
 * kartu "Informasi les" (Tutor · Lokasi · Sesi berikutnya, label 104px),
 * catatan, dan bilah aksi "Ajukan Perubahan Jadwal" (Secondary).
 * Bila sudah ada pengajuan yang diproses, tampil banner info dan tombol
 * mengarah ke pengajuan tersebut (satu pengajuan aktif per jadwal).
 */
function DetailJadwal() {
  const { routineId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(routineQuery(routineId))
  const routine = query.data

  return (
    <DetailScreen
      title="Detail Jadwal"
      footer={
        routine &&
        (routine.pendingRequest ? (
          <Button
            variant="secondary"
            nativeButton={false}
            render={
              <Link to={`/wali/jadwal/pengajuan/${routine.pendingRequest.id}`} />
            }
          >
            Lihat Pengajuan
          </Button>
        ) : (
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link to={`/wali/jadwal/${routine.id}/ubah`} />}
          >
            Ajukan Perubahan Jadwal
          </Button>
        ))
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat jadwal…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Jadwal tidak ditemukan"
            description="Jadwal ini mungkin sudah tidak berlaku."
            action={{
              label: "Kembali ke Jadwal",
              onClick: () => navigate("/wali/jadwal", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Jadwal gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : routine ? (
        <>
          <Card size="compact">
            <CardHeader className="gap-ns-2xs">
              <CardTitle>
                {routine.subject} · setiap {WEEKDAYS[routine.weekday]}
              </CardTitle>
              <p className="text-caption leading-normal text-grayscale-text-caption">
                {formatTimeSlot(routine.startTime, routine.durationMinutes)} ·
                berjalan sejak {formatDate(routine.since)}
              </p>
            </CardHeader>
          </Card>

          <Card size="compact">
            <CardHeader>
              <CardTitle>Informasi les</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-ns-m">
                <SummaryRow label="Tutor" labelClassName="w-[104px]">
                  {routine.tutor.name}
                </SummaryRow>
                <SummaryRow label="Lokasi" labelClassName="w-[104px]">
                  {routine.location}
                </SummaryRow>
                <SummaryRow label="Sesi berikutnya" labelClassName="w-[104px]">
                  {format(routine.nextSession, "EEEE, d MMM yyyy", {
                    locale: localeId,
                  })}
                </SummaryRow>
              </dl>
            </CardContent>
          </Card>

          {routine.pendingRequest ? (
            <AlertBanner
              status="info"
              title="Pengajuan perubahan sedang diproses"
              description={`${formatChangeTitle(routine.pendingRequest)}. Jadwal lama tetap berjalan sampai disetujui.`}
            />
          ) : (
            <p className="text-caption leading-normal text-grayscale-text-caption">
              Perlu ganti hari atau jam? Ajukan perubahan, lalu Pengelola LBB
              akan mengonfirmasinya dengan tutor.
            </p>
          )}
        </>
      ) : null}
    </DetailScreen>
  )
}

export { DetailJadwal }
