import { Link, useNavigate } from "react-router"

import {
  ResultScreen,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components"
import type { PendaftaranResult } from "@/types/pendaftaran"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import { formatDate } from "@/lib/format"

/*
 * Pendaftaran / Berhasil · kartu Ringkasan, aksi Primary Large "Pantau
 * Status Pendaftaran" + Tertiary "Kembali ke Beranda".
 * Desktop: Page header "Daftar Siswa Baru" (kembali ke Beranda); hasil di
 * tengah, tombol berdampingan (Tertiary kiri, Primary Large kanan).
 */
function PendaftaranBerhasil({ result }: { result: PendaftaranResult }) {
  const navigate = useNavigate()
  return (
    <ResultScreen
      pageTitle="Daftar Siswa Baru"
      pageBack={{
        label: "Beranda",
        onClick: () => navigate("/wali", { replace: true }),
      }}
      title="Pendaftaran terkirim"
      description={`Data ${result.studentName} sudah kami terima dan sedang menunggu verifikasi Pengelola LBB. Kami akan mengabari Anda setelah ada hasil.`}
      footer={
        <>
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
        </>
      }
    >
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
              />
            </SummaryRow>
          </dl>
        </CardContent>
      </Card>
    </ResultScreen>
  )
}

export { PendaftaranBerhasil }
