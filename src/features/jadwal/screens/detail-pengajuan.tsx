import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
} from "@/components"
import { changeRequestQuery, isNotFoundError } from "@/features/jadwal/api"
import { getErrorMessage } from "@/lib/api"
import {
  ChangeProgressCard,
  ChangeSummaryCard,
} from "@/features/jadwal/components"
import { CHANGE_STATUS_LABEL } from "@/features/jadwal/lib"
import { formatDate } from "@/lib/format"

/*
 * W4 · Detail pengajuan perubahan (dibuka dari "Pengajuan perubahan" di
 * daftar jadwal). Belum ada frame khusus di Figma, jadi layar ini menyusun
 * kartu dari frame "Pengajuan terkirim": Ringkasan · Alasan · Progres.
 *
 * Desktop (≥ lg): tanpa frame Figma, mengikuti pola W3 Status Pendaftaran
 * (desktop) — halaman putih, Page header (kembali "Jadwal Les", judul,
 * keterangan mapel · status · tanggal), kartu Progres di kolom utama dan
 * kartu Ringkasan + Alasan 380px di kanan, jarak 32 / 16.
 */
function DetailPengajuan() {
  const { requestId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(changeRequestQuery(requestId))
  const request = query.data

  return (
    <DetailScreen
      title="Pengajuan Perubahan"
      desktopHeader="page"
      backLabel="Jadwal Les"
      desktopWidth="wide"
      desktopDescription={
        request &&
        `${request.subject} · ${CHANGE_STATUS_LABEL[request.status]} · diajukan ${formatDate(request.submittedAt)}`
      }
      className="lg:pt-ns-3xl"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pengajuan…" />
      ) : query.isError ? (
        isNotFoundError(query.error) ? (
          <DataState
            state="empty"
            title="Pengajuan tidak ditemukan"
            description="Pengajuan ini mungkin sudah selesai diproses."
            action={{
              label: "Kembali ke Jadwal",
              onClick: () => navigate("/wali/jadwal", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Pengajuan gagal dimuat"
            description={getErrorMessage(query.error)}
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : request ? (
        /*
         * Mobile: urutan DOM (ringkasan · alasan · progres). Desktop: grid,
         * progres di kolom kiri membentang dua baris; ringkasan + alasan kanan.
         */
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-ns-3xl lg:gap-y-ns-l">
          <ChangeSummaryCard
            request={request}
            className="lg:col-start-2 lg:row-start-1"
          />
          <Card size="compact" className="lg:col-start-2 lg:row-start-2">
            <CardHeader>
              <CardTitle>Alasan perubahan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{request.reason}</p>
            </CardContent>
          </Card>
          <ChangeProgressCard
            request={request}
            className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
          />
        </div>
      ) : null}
    </DetailScreen>
  )
}

export { DetailPengajuan }
