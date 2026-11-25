import type * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/ui/data-state"
import {
  billRemaining,
  billStatus,
  billTotal,
  NotFoundError,
  studentBillQuery,
  type BillPayment,
} from "@/features/keuangan/api/laporan"
import { formatRupiah } from "@/lib/format/currency"
import { formatDayMonth } from "@/lib/format/date"

/*
 * P8 · Rincian Tagihan · Figma "Laporan Keuangan / Rincian tagihan".
 *
 * Kartu judul (siswa · bulan, badge status, no. invoice · wali) →
 * Perhitungan tagihan (per mapel: sesi × tarif, total) → Pembayaran (tiap
 * transaksi, sisa tagihan). Bilah aksi: Catat Pembayaran Manual (selama
 * belum lunas).
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })

const PAYMENT_STATUS: Record<BillPayment["status"], string> = {
  berhasil: "Berhasil",
  kedaluwarsa: "Kedaluwarsa",
  gagal: "Gagal",
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="gap-ns-m flex items-center justify-between leading-normal">
      <dt className="text-subtitle text-grayscale-text-body">{label}</dt>
      <dd className="text-subtitle text-grayscale-text-title shrink-0 font-bold">
        {value}
      </dd>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <div aria-hidden="true" className="bg-grayscale-border-disabled h-px" />
      <div className="gap-ns-m flex items-center justify-between leading-normal">
        <span className="text-subtitle text-grayscale-text-title font-bold">
          {label}
        </span>
        <span className="text-body text-grayscale-text-title font-bold">
          {formatRupiah(value)}
        </span>
      </div>
    </>
  )
}

const card =
  "gap-ns-m border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border"

function RincianTagihan() {
  const { billId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(studentBillQuery(billId))
  const bill = query.data
  const status = bill && billStatus(bill)

  return (
    <DetailScreen
      title="Rincian Tagihan"
      footer={
        bill &&
        status !== "lunas" && (
          <Button
            variant="secondary"
            nativeButton={false}
            render={
              <Link to={`/pengelola/laporan-keuangan/tagihan/${billId}/bayar`} />
            }
          >
            Catat Pembayaran Manual
          </Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat rincian tagihan…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Tagihan tidak ditemukan"
            description="Tagihan ini mungkin sudah dihapus atau tautannya keliru."
            action={{
              label: "Kembali ke Laporan Keuangan",
              onClick: () =>
                navigate("/pengelola/laporan-keuangan", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Rincian tagihan gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : bill && status ? (
        <>
          <section
            aria-label="Ringkasan tagihan"
            className="gap-ns-s border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal"
          >
            <div className="gap-ns-m flex items-start justify-between">
              <h2 className="text-subtitle text-grayscale-text-title font-bold">
                {bill.studentName} · {monthLabel(bill.period)}
              </h2>
              <StatusBadge category="pembayaran" status={status} />
            </div>
            <p className="text-caption text-grayscale-text-caption">
              {bill.number} · wali: {bill.guardianName}
            </p>
          </section>

          <section className="gap-ns-m flex flex-col">
            <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
              Perhitungan tagihan
            </h2>
            <div className={card}>
              <dl className="gap-ns-m flex flex-col">
                {bill.items.map((item) => (
                  <Row
                    key={item.subject}
                    label={`${item.subject} · ${item.sessions} sesi × ${formatRupiah(item.unitPrice)}`}
                    value={formatRupiah(item.sessions * item.unitPrice)}
                  />
                ))}
              </dl>
              <TotalRow label="Total tagihan" value={billTotal(bill)} />
            </div>
          </section>

          <section className="gap-ns-m flex flex-col">
            <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
              Pembayaran
            </h2>
            <div className={card}>
              {bill.payments.length > 0 ? (
                <dl className="gap-ns-m flex flex-col">
                  {bill.payments
                    .slice()
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map((p) => (
                      <Row
                        key={p.id}
                        label={`${formatDayMonth(p.createdAt)} · ${p.method} · ${p.manual ? "Dicatat manual" : PAYMENT_STATUS[p.status]}`}
                        value={formatRupiah(p.status === "berhasil" ? p.amount : 0)}
                      />
                    ))}
                </dl>
              ) : (
                <p className="text-subtitle text-grayscale-text-caption leading-normal">
                  Belum ada pembayaran.
                </p>
              )}
              <TotalRow label="Sisa tagihan" value={billRemaining(bill)} />
            </div>
          </section>
        </>
      ) : null}
    </DetailScreen>
  )
}

export { RincianTagihan }
