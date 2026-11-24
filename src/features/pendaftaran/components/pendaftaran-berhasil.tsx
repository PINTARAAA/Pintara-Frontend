import { CircleCheckIcon } from "lucide-react"
import { Link } from "react-router"

import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PendaftaranResult } from "@/features/pendaftaran/api/pendaftaran"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import { formatDate } from "@/lib/format/date"

/*
 * Pendaftaran / Berhasil · layar konfirmasi tanpa top app bar.
 * Isi di tengah (padding 32/24/24, gap 24): ikon sukses 88px berlatar
 * Semantic/Surface/success, judul H4/Bold, pesan, kartu Ringkasan.
 * Aksi di bawah: Primary Large "Pantau Status Pendaftaran" + Tertiary
 * "Kembali ke Beranda". Desktop: lebar maks. 480px di tengah.
 */
function PendaftaranBerhasil({ result }: { result: PendaftaranResult }) {
  return (
    <div className="flex flex-1 flex-col bg-grayscale-surface-default">
      <main className="mx-auto flex w-full max-w-120 flex-1 flex-col items-center justify-center gap-ns-2xl px-ns-2xl pt-ns-3xl pb-ns-2xl text-center">
        <div className="flex size-22 items-center justify-center rounded-full bg-success-subtle">
          <CircleCheckIcon
            aria-hidden="true"
            strokeWidth={2}
            className="size-11 text-grayscale-text-body"
          />
        </div>
        <div className="flex flex-col gap-ns-s">
          <h1 className="text-h4 font-bold text-grayscale-text-title">
            Pendaftaran terkirim
          </h1>
          <p className="text-subtitle leading-normal text-grayscale-text-body">
            Data {result.studentName} sudah kami terima dan sedang menunggu
            verifikasi Pengelola LBB. Kami akan mengabari Anda setelah ada
            hasil.
          </p>
        </div>
        <Card size="compact" className="w-full text-left">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-ns-m">
              <SummaryRow label="No. pendaftaran" align="between">
                {result.registrationNumber}
              </SummaryRow>
              <SummaryRow label="Tanggal" align="between">
                {formatDate(result.submittedAt)}
              </SummaryRow>
              <SummaryRow label="Status" align="between">
                <StatusBadge
                  category="pendaftaran"
                  status="menunggu_verifikasi"
                  className="font-normal"
                />
              </SummaryRow>
            </dl>
          </CardContent>
        </Card>
      </main>

      <div className="mx-auto flex w-full max-w-120 flex-col gap-ns-s px-ns-2xl pt-ns-l pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))]">
        <Button
          size="lg"
          nativeButton={false}
          render={
            <Link
              to={`/wali/pendaftaran/status?id=${encodeURIComponent(result.id)}`}
              replace
            />
          }
        >
          Pantau Status Pendaftaran
        </Button>
        <Button
          variant="tertiary"
          nativeButton={false}
          render={<Link to="/wali" replace />}
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  )
}

export { PendaftaranBerhasil }
