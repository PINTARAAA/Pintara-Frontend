import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import {
  formatTimeSlot,
  WEEKDAYS,
  type ChangeRequest,
} from "@/features/jadwal/api/jadwal"
import { formatScope } from "@/features/jadwal/lib/format"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import { formatDateTime } from "@/lib/format/date"

/* Kartu "Ringkasan pengajuan": Dari · Menjadi · Berlaku (label 104px) */
function ChangeSummaryCard({ request }: { request: ChangeRequest }) {
  const slot = (weekday: number, time: string) =>
    `${WEEKDAYS[weekday]}, ${formatTimeSlot(time, request.durationMinutes)}`

  return (
    <Card size="compact" className="w-full text-left">
      <CardHeader>
        <CardTitle>Ringkasan pengajuan</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-ns-m">
          <SummaryRow label="Dari" labelClassName="w-[104px]">
            {slot(request.from.weekday, request.from.startTime)}
          </SummaryRow>
          <SummaryRow label="Menjadi" labelClassName="w-[104px]">
            {slot(request.to.weekday, request.to.startTime)}
          </SummaryRow>
          <SummaryRow label="Berlaku" labelClassName="w-[104px]">
            {formatScope(request)}
          </SummaryRow>
        </dl>
      </CardContent>
    </Card>
  )
}

/*
 * Kartu "Progres pengajuan": Pengajuan dikirim → Ditinjau Pengelola LBB →
 * Konfirmasi tutor → Jadwal baru berlaku (atau → Pengajuan ditolak).
 */
function ChangeProgressCard({ request }: { request: ChangeRequest }) {
  const { status } = request
  const step = {
    ditinjau_pengelola: 1,
    konfirmasi_tutor: 2,
    disetujui: 4,
    ditolak: 1,
  }[status]
  const stateOf = (index: number) =>
    index < step ? "done" : index === step ? "current" : "upcoming"

  return (
    <Card size="compact" className="w-full text-left">
      <CardHeader>
        <CardTitle>Progres pengajuan</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline aria-label="Progres pengajuan">
          <TimelineItem
            state="done"
            title="Pengajuan dikirim"
            timestamp={formatDateTime(request.submittedAt)}
          />
          {status === "ditolak" ? (
            <TimelineItem
              state="rejected"
              title="Pengajuan ditolak"
              description="Jadwal lama tetap berlaku."
            />
          ) : (
            <>
              <TimelineItem state={stateOf(1)} title="Ditinjau Pengelola LBB" />
              <TimelineItem state={stateOf(2)} title="Konfirmasi tutor" />
              <TimelineItem state={stateOf(3)} title="Jadwal baru berlaku" />
            </>
          )}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export { ChangeSummaryCard, ChangeProgressCard }
