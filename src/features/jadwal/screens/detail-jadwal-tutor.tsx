import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useNavigate, useParams } from "react-router";

import {
  DetailScreen,
  AlertBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
} from "@/components";
import {
  isNotFoundError,
  tutorScheduleSessionQuery,
} from "@/features/jadwal/api";
import { getErrorMessage } from "@/lib/api";
import type { TutorScheduleDetail } from "@/types/jadwal";

import { SummaryRow } from "@/features/pendaftaran/components";
import {
  formatTimeRange,
  formatWeekdayDate,
  toWhatsAppUrl,
} from "@/lib/format";

/*
 * T5 · Detail Jadwal (tutor) · Figma "Jadwal / Tutor - Detail sesi".
 *
 * Kartu judul (mapel · siswa, hari · jam) → "Siswa & lokasi" (Siswa ·
 * Alamat · Wali, label 104px) → "Pertemuan sebelumnya" (Tanggal · Materi ·
 * Catatan) → banner info presensi → bilah aksi "Hubungi Wali" (WhatsApp).
 * Desktop (Figma "Jadwal / Tutor - Detail sesi (Desktop)"): Page header
 * (kembali "Jadwal", judul mapel · siswa, keterangan hari · jam, tombol
 * "Hubungi Wali" di kanan) menggantikan kartu judul; dua kartu berdampingan,
 * banner presensi selebar konten.
 */

/* "Hari ini, Selasa 24 Nov · 18.30–20.00" · "Rabu, 25 Nov · 16.00–17.30" */
function formatWhen(start: Date, end: Date) {
  const day = isToday(start)
    ? `Hari ini, ${format(start, "EEEE d MMM", { locale: localeId })}`
    : formatWeekdayDate(start);
  return `${day} · ${formatTimeRange(start, end)}`;
}

function DetailJadwalTutor() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const query = useQuery(tutorScheduleSessionQuery(sessionId));
  const session = query.data;

  return (
    <DetailScreen
      title="Detail Jadwal"
      desktopHeader="page"
      backLabel="Jadwal"
      desktopWidth="wide"
      desktopActions="header"
      desktopTitle={session && `${session.subject} · ${session.student.name}`}
      desktopDescription={session && formatWhen(session.start, session.end)}
      className="lg:pt-ns-3xl"
      footer={
        session && (
          <Button
            variant="secondary"
            nativeButton={false}
            render={
              <a
                href={toWhatsAppUrl(session.parent.whatsapp) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Hubungi Wali
          </Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat jadwal…" />
      ) : query.isError ? (
        isNotFoundError(query.error) ? (
          <DataState
            state="empty"
            title="Jadwal tidak ditemukan"
            description="Sesi ini mungkin sudah dipindahkan atau dibatalkan."
            action={{
              label: "Kembali ke Jadwal",
              onClick: () => navigate("/tutor/jadwal", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Jadwal gagal dimuat"
            description={getErrorMessage(query.error)}
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : session ? (
        <>
          <Card size="compact" className="lg:hidden">
            <CardHeader className="gap-ns-2xs">
              <CardTitle>
                {session.subject} · {session.student.name}
              </CardTitle>
              <p className="text-caption leading-normal text-grayscale-text-caption">
                {formatWhen(session.start, session.end)}
              </p>
            </CardHeader>
          </Card>

          {/* Desktop: dua kartu berdampingan, tinggi disamakan */}
          <div className="contents lg:grid lg:grid-cols-2 lg:gap-ns-2xl">
            <Card size="compact">
              <CardHeader>
                <CardTitle>Siswa & lokasi</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-ns-m">
                  <SummaryRow label="Siswa" labelClassName="w-[104px]">
                    {session.student.grade
                      ? `${session.student.name} · ${session.student.grade}`
                      : session.student.name}
                  </SummaryRow>
                  {session.address && (
                    <SummaryRow label="Alamat" labelClassName="w-[104px]">
                      {session.address}
                    </SummaryRow>
                  )}
                  <SummaryRow label="Wali" labelClassName="w-[104px]">
                    {session.parent.name} ·{" "}
                    <span className="whitespace-nowrap">
                      {session.parent.phone}
                    </span>
                  </SummaryRow>
                </dl>
              </CardContent>
            </Card>

            <PreviousMeeting previous={session.previous} />
          </div>

          <PresensiBanner
            session={session}
            onOpen={() => navigate("/tutor/presensi")}
          />
        </>
      ) : null}
    </DetailScreen>
  );
}

function PreviousMeeting({
  previous,
}: {
  previous: TutorScheduleDetail["previous"];
}) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Pertemuan sebelumnya</CardTitle>
      </CardHeader>
      <CardContent>
        {previous ? (
          <dl className="flex flex-col gap-ns-m">
            <SummaryRow label="Tanggal" labelClassName="w-[104px]">
              {formatWeekdayDate(previous.date)}
            </SummaryRow>
            <SummaryRow label="Materi" labelClassName="w-[104px]">
              {previous.topic
                ? `${previous.topic} (${previous.subject})`
                : previous.subject}
            </SummaryRow>
            {previous.notes && (
              <SummaryRow label="Catatan" labelClassName="w-[104px]">
                {previous.notes}
              </SummaryRow>
            )}
          </dl>
        ) : (
          <p className="text-subtitle leading-normal text-grayscale-text-body">
            Ini pertemuan pertama Anda dengan siswa ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* Presensi baru bisa diisi setelah sesi dimulai (T2) */
function PresensiBanner({
  session,
  onOpen,
}: {
  session: TutorScheduleDetail;
  onOpen: () => void;
}) {
  if (isAfter(session.start, new Date())) {
    return (
      <AlertBanner
        status="info"
        title="Presensi dibuka saat sesi dimulai"
        description={`Isi presensi mulai pukul ${format(session.start, "HH.mm")} dari menu Presensi.`}
      />
    );
  }
  return (
    <AlertBanner
      status="info"
      title="Sesi sudah dimulai"
      description="Isi presensi dan dokumentasi sesi ini dari menu Presensi."
      action={{ label: "Buka Presensi", onClick: onOpen }}
    />
  );
}

export { DetailJadwalTutor };
