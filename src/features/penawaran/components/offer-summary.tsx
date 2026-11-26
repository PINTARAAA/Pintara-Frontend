import {
  StatusBadge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components"
import { SummaryRow } from "@/features/pendaftaran/components"
import { declineLabel } from "@/features/penawaran/api"
import type { Offer, OfferSummary } from "@/types/penawaran"
import { formatKm } from "@/features/penawaran/lib"
import { formatRupiah } from "@/lib/format/currency"

/* Kartu "Ringkasan penawaran" (P4 · Buat penawaran & Detail), label 104px */
function OfferSummaryCard({ offer }: { offer: OfferSummary }) {
  const row = "w-[104px]"
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Ringkasan penawaran</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="gap-ns-m flex flex-col">
          <SummaryRow label="Siswa" labelClassName={row}>
            {offer.student.name} · {offer.student.grade} {offer.student.level}
          </SummaryRow>
          <SummaryRow label="Tutor" labelClassName={row}>
            {offer.tutor.name}
          </SummaryRow>
          <SummaryRow label="Mata pelajaran" labelClassName={row}>
            {offer.subjects.join(", ")}
          </SummaryRow>
          <SummaryRow label="Jadwal diminta" labelClassName={row}>
            {offer.schedule}
          </SummaryRow>
          <SummaryRow label="Lokasi" labelClassName={row}>
            {offer.location} · {formatKm(offer.distanceKm)}
          </SummaryRow>
          <SummaryRow label="Tarif tutor" labelClassName={row}>
            {formatRupiah(offer.rate)} per sesi
          </SummaryRow>
        </dl>
      </CardContent>
    </Card>
  )
}

/* Kartu "Penawaran" pada layar hasil (Diterima · Ditolak) */
function ResultOfferCard({ offer }: { offer: Offer }) {
  const row = "w-[104px]"
  return (
    <Card size="compact" className="w-full">
      <CardHeader>
        <CardTitle>Penawaran</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="gap-ns-m flex flex-col">
          {offer.status === "ditolak" ? (
            <>
              <SummaryRow label="Tutor" labelClassName={row}>
                {offer.tutor.name}
              </SummaryRow>
              <SummaryRow label="Alasan" labelClassName={row}>
                {offer.decline && declineLabel(offer.decline.reason)}
              </SummaryRow>
            </>
          ) : (
            <>
              <SummaryRow label="Siswa" labelClassName={row}>
                {offer.student.name}
              </SummaryRow>
              <SummaryRow label="Tutor" labelClassName={row}>
                {offer.tutor.name}
              </SummaryRow>
            </>
          )}
          {offer.status !== "menunggu_konfirmasi" && (
            <SummaryRow label="Status" labelClassName={row}>
              <StatusBadge category="penawaran_tutor" status={offer.status} />
            </SummaryRow>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

export { OfferSummaryCard, ResultOfferCard }
