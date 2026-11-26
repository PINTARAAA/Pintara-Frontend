import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
} from "@/components"
import {
  honorDetailQuery,
  METHOD_LABEL,
  HonorNotFoundError,
} from "@/features/keuangan/api"
import { SummaryRow } from "@/features/pendaftaran/components"
import {
  firstName,
  formatWeekdayDate,
  formatRupiah,
  formatDate,
} from "@/lib/format"

/*
 * P7 · Rincian Honor · Figma "Honor / Rincian tutor"
 *
 * Kartu judul (tutor · bulan, badge status pembayaran, total) → Perhitungan
 * (per mapel: sesi × tarif, total; "Lihat N sesi" bila rincian sesi
 * tersedia) → Pengambilan honor (metode biasa, catatan) → [Pembayaran].
 * Bilah aksi: Catat Pembayaran (selama belum lunas).
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })

function RincianHonor() {
  const { month = "", tutorId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(honorDetailQuery(month, tutorId))
  const honor = query.data
  const [showSessions, setShowSessions] = React.useState(false)

  return (
    <DetailScreen
      title="Rincian Honor"
      footer={
        honor &&
        honor.status !== "lunas" && (
          <Button
            nativeButton={false}
            render={
              <Link
                to={`/pengelola/keuangan/honor/${month}/${tutorId}/bayar`}
              />
            }
          >
            Catat Pembayaran
          </Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat rincian honor…" />
      ) : query.isError ? (
        query.error instanceof HonorNotFoundError ? (
          <DataState
            state="empty"
            title="Rincian honor tidak ditemukan"
            description="Rekap honor bulan ini mungkin belum dihitung."
            action={{
              label: "Kembali ke Keuangan",
              onClick: () => navigate("/pengelola/keuangan", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Rincian honor gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : honor ? (
        <>
          <section
            aria-label="Ringkasan honor"
            className="gap-ns-s border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal"
          >
            <div className="gap-ns-m flex items-start justify-between">
              <h2 className="text-subtitle text-grayscale-text-title font-bold">
                {honor.name} · {monthLabel(honor.month)}
              </h2>
              <StatusBadge category="pembayaran" status={honor.status} />
            </div>
            <p className="text-h3 text-grayscale-text-title font-bold">
              {formatRupiah(honor.total)}
            </p>
          </section>

          <Card size="compact">
            <CardHeader className="gap-ns-2xs">
              <CardTitle>Perhitungan</CardTitle>
              <p className="text-caption text-primary-text-primary leading-normal">
                Dari {honor.sessions} presensi terverifikasi final
              </p>
            </CardHeader>
            <CardContent className="gap-ns-m flex flex-col">
              <dl className="gap-ns-m flex flex-col">
                {honor.lines.map((line) => (
                  <SummaryRow
                    key={line.subject}
                    align="between"
                    label={`${line.subject} · ${line.sessions} sesi × ${formatRupiah(line.rate)}`}
                  >
                    {formatRupiah(line.amount)}
                  </SummaryRow>
                ))}
              </dl>
              <div
                aria-hidden="true"
                className="bg-grayscale-border-disabled h-px"
              />
              <div className="gap-ns-m flex items-center justify-between leading-normal">
                <span className="text-subtitle text-grayscale-text-title font-bold">
                  Total honor
                </span>
                <span className="text-body text-grayscale-text-title font-bold">
                  {formatRupiah(honor.total)}
                </span>
              </div>

              {honor.sessionList && honor.sessionList.length > 0 && (
                <>
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="w-fit"
                    aria-expanded={showSessions}
                    onClick={() => setShowSessions((v) => !v)}
                  >
                    {showSessions
                      ? "Sembunyikan sesi"
                      : `Lihat ${honor.sessionList.length} sesi`}
                  </Button>
                  {showSessions && (
                    <ul className="gap-ns-s text-caption text-grayscale-text-body flex flex-col leading-normal">
                      {honor.sessionList
                        .slice()
                        .sort((a, b) => a.start.getTime() - b.start.getTime())
                        .map((s) => (
                          <li
                            key={s.id}
                            className="gap-ns-m flex justify-between"
                          >
                            <span>
                              {formatWeekdayDate(s.start)} · {s.subject} ·{" "}
                              {firstName(s.student.name)}
                            </span>
                            <span className="text-grayscale-text-caption shrink-0">
                              {s.record?.actualStart}–{s.record?.actualEnd}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {honor.payment ? (
            <Card size="compact">
              <CardHeader>
                <CardTitle>Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="gap-ns-m flex flex-col">
                  <SummaryRow label="Nominal" align="between">
                    {formatRupiah(honor.payment.amount)}
                  </SummaryRow>
                  <SummaryRow label="Metode" align="between">
                    {METHOD_LABEL[honor.payment.method]}
                  </SummaryRow>
                  <SummaryRow label="Tanggal" align="between">
                    {formatDate(honor.payment.paidAt)}
                  </SummaryRow>
                  <SummaryRow label="Bukti" align="between">
                    <span className="break-all">
                      {honor.payment.proof.name}
                    </span>
                  </SummaryRow>
                </dl>
              </CardContent>
            </Card>
          ) : (
            <Card size="compact">
              <CardHeader>
                <CardTitle>Pengambilan honor</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="gap-ns-m flex flex-col">
                  <SummaryRow label="Metode biasa" align="between">
                    {METHOD_LABEL[honor.method]}
                  </SummaryRow>
                  {honor.methodNote && (
                    <SummaryRow label="Catatan" align="between">
                      {honor.methodNote}
                    </SummaryRow>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </DetailScreen>
  )
}

export { RincianHonor }
