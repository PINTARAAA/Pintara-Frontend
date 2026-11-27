import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Link, useNavigate, useSearchParams } from "react-router";

import {
  DetailScreen,
  AlertBanner,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataState,
  Timeline,
  TimelineItem,
} from "@/components";
import { registrationStatusQuery } from "@/features/pendaftaran/api";
import type {
  RegistrationLbbContact,
  Registration,
  RegistrationStage,
} from "@/types/pendaftaran";

import { SummaryRow } from "@/features/pendaftaran/components";
import type { StatusOf } from "@/lib/constants";
import { formatDate, formatDateTime, firstName } from "@/lib/format";

/*
 * W3 · Status Pendaftaran · Figma PINTARA → UI Screen → Wali Murid
 *
 * Frame: Menunggu Verifikasi · Pencocokan Tutor · Selesai · Ditolak · Kosong.
 * Latar Grayscale/Surface/subtitle, konten padding 16 (bawah 24), gap 16:
 *   [banner hasil] · kartu siswa (nama, no. & tanggal kirim, badge, ringkasan)
 *   · kartu "Progres Pendaftaran" (Timeline) · [tombol Daftar Ulang]
 *
 * Desktop (≥ lg, frame "… (Desktop)"): latar putih, Page header (kembali
 *   "Beranda" + judul H3). Banner hasil selebar konten; di bawahnya kartu
 *   Progres (kolom utama) dan kartu siswa 380px + [Daftar Ulang] di kanan,
 *   jarak 32. Kosong: kartu Data state 480px di tengah berisi tombol.
 *
 * ?id=… menampilkan pendaftaran tertentu; tanpa id → pendaftaran terbaru.
 */
const BADGE: Record<RegistrationStage, StatusOf<"pendaftaran">> = {
  menunggu_verifikasi: "menunggu_verifikasi",
  pencocokan_tutor: "terverifikasi",
  selesai: "terverifikasi",
  ditolak: "ditolak",
};

/* "Rabu & Jumat, 16.00" · "Senin, Rabu & Jumat, 16.00" */
function formatRequestedSchedule(days: string[], startTime: string) {
  const list =
    days.length > 1
      ? `${days.slice(0, -1).join(", ")} & ${days.at(-1)}`
      : (days[0] ?? "-");
  return `${list}, ${startTime}`;
}

/* "Rabu, 3 Des 2026" */
const formatLongWeekdayDate = (date: Date) =>
  format(date, "EEEE, d MMM yyyy", { locale: localeId });

const whatsappUrl = (contact: RegistrationLbbContact) =>
  `https://wa.me/${contact.whatsapp}`;

function StatusPendaftaran() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id") ?? undefined;
  /* Hanya development: ?contoh=… menampilkan contoh frame Figma */
  const example = import.meta.env.DEV
    ? (params.get("contoh") ?? undefined)
    : undefined;

  const query = useQuery(registrationStatusQuery(id, example));
  const registration = query.data?.registration;

  return (
    <DetailScreen
      title="Status Pendaftaran"
      desktopHeader="page"
      backLabel="Beranda"
      desktopWidth="wide"
      className="lg:flex-1 lg:gap-ns-3xl lg:pt-ns-3xl lg:pb-ns-4xl"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat status pendaftaran…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Status gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : !registration ? (
        <div className="flex flex-1 flex-col justify-center gap-ns-l">
          {/* Mobile: tombol di bawah kartu; desktop: tombol di dalam kartu */}
          <DataState
            state="empty"
            title="Belum ada pendaftaran"
            description="Daftarkan siswa untuk mulai les privat di LBB Jelajah Ilmu."
            className="lg:hidden"
          />
          <DataState
            state="empty"
            title="Belum ada pendaftaran"
            description="Daftarkan siswa untuk mulai les privat di LBB Jelajah Ilmu."
            action={{
              label: "Daftar Siswa Baru",
              onClick: () => navigate("/wali/pendaftaran"),
            }}
            className="hidden lg:flex"
          />
          <Button
            nativeButton={false}
            render={<Link to="/wali/pendaftaran" />}
            className="lg:hidden"
          >
            Daftar Siswa Baru
          </Button>
        </div>
      ) : (
        <>
          <ResultBanner
            registration={registration}
            contact={query.data.contact}
            onOpenSchedule={() => navigate("/wali/jadwal")}
          />
          {/*
           * Mobile: urutan DOM (siswa · progres · tombol). Desktop: grid,
           * progres di kolom kiri membentang dua baris; siswa + tombol kanan.
           */}
          <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-ns-3xl lg:gap-y-ns-l">
            <StudentCard
              registration={registration}
              className="lg:col-start-2 lg:row-start-1"
            />
            <ProgressCard
              registration={registration}
              className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
            />
            {registration.stage === "ditolak" && (
              <Button
                nativeButton={false}
                render={<Link to="/wali/pendaftaran" />}
                className="lg:col-start-2 lg:row-start-2"
              >
                Daftar Ulang
              </Button>
            )}
          </div>
        </>
      )}
    </DetailScreen>
  );
}

/* Banner hasil akhir: Selesai (success) atau Ditolak (error) */
function ResultBanner({
  registration,
  contact,
  onOpenSchedule,
}: {
  registration: Registration;
  contact: RegistrationLbbContact;
  onOpenSchedule: () => void;
}) {
  const { stage, match, firstSession, rejection } = registration;

  if (stage === "selesai" && match && firstSession) {
    return (
      <AlertBanner
        status="success"
        title="Pendaftaran selesai"
        description={`${firstName(registration.studentName)} akan belajar bersama ${match.tutorName} mulai ${formatLongWeekdayDate(firstSession.start)}.`}
        action={{ label: "Lihat jadwal les", onClick: onOpenSchedule }}
      />
    );
  }

  if (stage === "ditolak" && rejection) {
    return (
      <AlertBanner
        status="error"
        title="Pendaftaran ditolak"
        description={`Alasan: ${rejection.reason.charAt(0).toLowerCase()}${rejection.reason.slice(1)}`}
        action={{
          label: "Hubungi Pengelola LBB",
          onClick: () =>
            window.open(whatsappUrl(contact), "_blank", "noopener,noreferrer"),
        }}
      />
    );
  }

  return null;
}

/* Kartu siswa: nama, no. pendaftaran · tanggal kirim, badge, ringkasan */
function StudentCard({
  registration,
  className,
}: {
  registration: Registration;
  className?: string;
}) {
  return (
    <Card size="compact" className={className}>
      <CardHeader>
        <CardTitle>{registration.studentName}</CardTitle>
        <CardDescription>
          {registration.number} · Dikirim {formatDate(registration.submittedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBadge
          category="pendaftaran"
          status={BADGE[registration.stage]}
        />
        <dl className="flex flex-col gap-ns-m">
          <SummaryRow label="Mata pelajaran" labelClassName="w-[100px]">
            {registration.subjects.join(", ")}
          </SummaryRow>
          <SummaryRow label="Jadwal diminta" labelClassName="w-[100px]">
            {formatRequestedSchedule(registration.days, registration.startTime)}
          </SummaryRow>
        </dl>
      </CardContent>
    </Card>
  );
}

/* Kartu "Progres Pendaftaran": langkah Timeline sesuai tahap */
function ProgressCard({
  registration,
  className,
}: {
  registration: Registration;
  className?: string;
}) {
  const {
    stage,
    submittedAt,
    verifiedAt,
    match,
    firstSession,
    rejection,
    subjects,
  } = registration;
  const verified = stage !== "menunggu_verifikasi";
  const matched = stage === "selesai";

  return (
    <Card size="compact" className={className}>
      <CardHeader>
        <CardTitle>Progres Pendaftaran</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline aria-label="Progres pendaftaran">
          <TimelineItem
            state="done"
            title="Pendaftaran dikirim"
            description="Data pendaftaran berhasil dikirim."
            timestamp={formatDateTime(submittedAt)}
          />

          {stage === "ditolak" ? (
            <TimelineItem
              state="rejected"
              title="Pendaftaran ditolak"
              description={rejection?.reason}
              timestamp={rejection && formatDateTime(rejection.rejectedAt)}
            />
          ) : (
            <>
              <TimelineItem
                state={verified ? "done" : "current"}
                title="Verifikasi data"
                description={
                  verified
                    ? "Data pendaftaran telah diverifikasi."
                    : "Pengelola LBB sedang memeriksa kelengkapan data pendaftaran."
                }
                timestamp={verifiedAt && formatDateTime(verifiedAt)}
              />
              <TimelineItem
                state={matched ? "done" : verified ? "current" : "upcoming"}
                title="Pencocokan tutor"
                description={
                  matched && match
                    ? `Tutor: ${match.tutorName} (${subjects.join(", ")}).`
                    : verified
                      ? `Pengelola LBB sedang mencari tutor yang sesuai untuk ${firstName(registration.studentName)}.`
                      : "Mencari tutor sesuai mapel, jenjang kelas, jadwal, dan jarak."
                }
                timestamp={match && formatDateTime(match.matchedAt)}
              />
              <TimelineItem
                state={matched ? "done" : "upcoming"}
                title="Hasil pendaftaran"
                description={
                  firstSession
                    ? `Les dimulai ${formatLongWeekdayDate(firstSession.start)} pukul ${format(firstSession.start, "HH.mm")}.`
                    : "Tutor dan jadwal les akan dikonfirmasi."
                }
                timestamp={
                  firstSession && formatDateTime(firstSession.confirmedAt)
                }
              />
            </>
          )}
        </Timeline>
      </CardContent>
    </Card>
  );
}

export { StatusPendaftaran };
