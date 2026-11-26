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
import { changeRequestQuery, NotFoundError } from "@/features/jadwal/api/jadwal"
import {
  ChangeProgressCard,
  ChangeSummaryCard,
} from "@/features/jadwal/components/change-request"

/*
 * W4 · Detail pengajuan perubahan (dibuka dari "Pengajuan perubahan" di
 * daftar jadwal). Belum ada frame khusus di Figma, jadi layar ini menyusun
 * kartu dari frame "Pengajuan terkirim": Ringkasan · Alasan · Progres.
 */
function DetailPengajuan() {
  const { requestId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(changeRequestQuery(requestId))
  const request = query.data

  return (
    <DetailScreen title="Pengajuan Perubahan">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pengajuan…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
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
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : request ? (
        <>
          <ChangeSummaryCard request={request} />
          <Card size="compact">
            <CardHeader>
              <CardTitle>Alasan perubahan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{request.reason}</p>
            </CardContent>
          </Card>
          <ChangeProgressCard request={request} />
        </>
      ) : null}
    </DetailScreen>
  )
}

export { DetailPengajuan }
