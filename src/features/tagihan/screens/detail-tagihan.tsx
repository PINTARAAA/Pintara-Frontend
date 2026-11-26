import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataState,
} from "@/components"
import {
  billQuery,
  NotFoundError,
  remainingOf,
  statusOf,
} from "@/features/tagihan/api"
import { formatDue, formatPeriod } from "@/features/tagihan/lib"
import { formatRupiah } from "@/lib/format/currency"
import { formatDate } from "@/lib/format/date"
import type { Bill } from "@/types/tagihan"

/*
 * W6 · Tagihan / Detail · kartu tagihan (periode, no. invoice · siswa,
 * badge, sisa H4, jatuh tempo) dan kartu "Rincian Biaya". Bilah aksi
 * "Bayar Rp…" selama belum lunas.
 */
function DetailTagihan() {
  const { billId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(billQuery(billId))
  const bill = query.data
  const remaining = bill ? remainingOf(bill) : 0

  return (
    <DetailScreen
      title="Detail Tagihan"
      footer={
        bill &&
        remaining > 0 && (
          <Button
            nativeButton={false}
            render={<Link to={`/wali/tagihan/${bill.id}/bayar`} />}
          >
            Bayar {formatRupiah(remaining)}
          </Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat tagihan…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Tagihan tidak ditemukan"
            description="Tagihan ini mungkin sudah tidak tersedia."
            action={{
              label: "Kembali ke Tagihan",
              onClick: () => navigate("/wali/tagihan", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Tagihan gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : bill ? (
        <>
          <BillCard bill={bill} />
          <CostBreakdown bill={bill} />
        </>
      ) : null}
    </DetailScreen>
  )
}

function BillCard({ bill }: { bill: Bill }) {
  const remaining = remainingOf(bill)
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Tagihan {formatPeriod(bill.period)}</CardTitle>
        <CardDescription>
          {bill.number} · {bill.studentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBadge category="pembayaran" status={statusOf(bill)} />
        <p className="text-h4 font-bold text-grayscale-text-title">
          {formatRupiah(remaining > 0 ? remaining : bill.total)}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {remaining > 0
            ? formatDue(bill, "long")
            : `Lunas · jatuh tempo ${formatDate(bill.dueDate)}`}
        </p>
      </CardContent>
    </Card>
  )
}

/* "Rincian Biaya": item per mapel, garis pemisah, total, dibayar, sisa */
function CostBreakdown({ bill }: { bill: Bill }) {
  const row = "flex items-start justify-between gap-ns-m leading-normal"
  const label = "min-w-0 flex-1 text-caption text-grayscale-text-caption"
  const value = "shrink-0 font-bold whitespace-nowrap text-grayscale-text-title"

  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Rincian Biaya</CardTitle>
        <CardDescription>
          Dihitung dari sesi yang terjadwal pada periode ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-ns-m">
          {bill.items.map((item) => (
            <div key={item.subject} className={row}>
              <dt className={label}>
                {item.subject} · {item.sessions} sesi ×{" "}
                {formatRupiah(item.unitPrice)}
              </dt>
              <dd className={value}>
                {formatRupiah(item.sessions * item.unitPrice)}
              </dd>
            </div>
          ))}
          <div aria-hidden="true" className="h-px bg-grayscale-border-disabled" />
          <div className={row}>
            <dt className={label}>Total tagihan</dt>
            <dd className={value}>{formatRupiah(bill.total)}</dd>
          </div>
          <div className={row}>
            <dt className={label}>Sudah dibayar</dt>
            <dd className={value}>{formatRupiah(bill.paid)}</dd>
          </div>
          <div className={row}>
            <dt className="flex-1 font-bold text-grayscale-text-title">
              Sisa tagihan
            </dt>
            <dd className="shrink-0 text-body font-bold text-grayscale-text-title">
              {formatRupiah(remainingOf(bill))}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export { DetailTagihan }
