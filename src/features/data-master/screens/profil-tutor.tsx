import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import { DetailScreen, Button, DataState } from "@/components"
import {
  formatDays,
  formatLevelsLong,
  initialsOf,
  isNotFoundError,
  setTutorStatus,
  tutorQuery,
} from "@/features/data-master/api"
import { SERVICE_RADIUS_KM } from "@/lib/data/data-master"
import {
  InfoCard,
  ProfileHeader,
  ProfileMenu,
  StatusToggle,
} from "@/features/data-master/components"
import { formatRupiah } from "@/lib/format"

/*
 * P9 · Profil Tutor · Figma "Data Tutor / Profil" dan "Tidak bisa
 * dinonaktifkan".
 *
 * Identitas (sejak, siswa aktif, status) → Kontak → Kualifikasi →
 * Ketersediaan & lokasi → Honor. Bilah aksi: Nonaktifkan (ditolak bila
 * masih ada jadwal aktif) · Ubah Profil.
 *
 * Desktop (Figma "Data Tutor / Profil (Desktop)" dan "Tidak bisa
 * dinonaktifkan (Desktop)"): Page header "← Data Tutor" dengan tombol di
 * kanan; identitas selebar konten, empat kartu info dalam grid 2 kolom.
 */
const shortName = (name: string) => name.split(" ").slice(0, 2).join(" ")

function ProfilTutor() {
  const { tutorId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(tutorQuery(tutorId))
  const tutor = query.data

  return (
    <DetailScreen
      title="Profil Tutor"
      backLabel="Data Tutor"
      desktopHeader="page"
      desktopActions="header"
      desktopWidth="wide"
      action={
        tutor && (
          <ProfileMenu
            items={[
              {
                label: "Lihat jadwal les",
                onClick: () => navigate("/pengelola/les?tab=jadwal"),
              },
              {
                label: "Lihat rekap honor",
                onClick: () => navigate("/pengelola/keuangan"),
              },
            ]}
          />
        )
      }
      footer={
        tutor && (
          <>
            <StatusToggle
              status={tutor.status}
              shortName={shortName(tutor.name)}
              queryKey={["data-master", "tutor"]}
              scheduleHint="Pindahkan jadwal ke tutor lain"
              deactivateNote="Tutor tidak akan muncul di pencocokan dan tidak bisa masuk ke aplikasi. Riwayat les dan honor tetap tersimpan."
              activeSchedules={tutor.activeSchedules}
              onChange={(status) => setTutorStatus(tutor.id, status)}
            />
            <Button
              nativeButton={false}
              render={<Link to={`/pengelola/tutor/${tutor.id}/ubah`} />}
            >
              Ubah Profil
            </Button>
          </>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat profil tutor…" />
      ) : query.isError ? (
        isNotFoundError(query.error) ? (
          <DataState
            state="empty"
            title="Tutor tidak ditemukan"
            description="Data tutor ini mungkin sudah dihapus atau tautannya keliru."
            action={{
              label: "Kembali ke Data Tutor",
              onClick: () => navigate("/pengelola/tutor", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Profil tutor gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : tutor ? (
        <>
          <ProfileHeader
            name={tutor.name}
            initials={initialsOf(tutor.name)}
            caption={`Tutor sejak ${format(tutor.joinedAt, "MMMM yyyy", { locale: localeId })} · ${tutor.activeStudents} siswa aktif`}
            status={tutor.status}
          />
          {/* Desktop: kartu info dalam grid 2 kolom, jarak 24 */}
          <div className="lg:gap-ns-2xl contents lg:grid lg:grid-cols-2">
            <InfoCard
              title="Kontak"
              rows={[
                ["WhatsApp", tutor.phone],
                ["Email", <span className="break-all">{tutor.email}</span>],
              ]}
            />
            <InfoCard
              title="Kualifikasi"
              rows={[
                ["Pendidikan", tutor.education],
                ["Mata pelajaran", tutor.subjects.join(", ")],
                ["Jenjang", formatLevelsLong(tutor.levels)],
              ]}
            />
            <InfoCard
              title="Ketersediaan & lokasi"
              rows={[
                ["Hari", formatDays(tutor.days)],
                ["Jam", `${tutor.from}–${tutor.until}`],
                [
                  "Domisili",
                  `Kec. ${tutor.district} · layanan ≤ ${SERVICE_RADIUS_KM} km`,
                ],
              ]}
            />
            <InfoCard
              title="Honor"
              rows={[
                [
                  "Tarif per sesi",
                  tutor.rate === null ? (
                    <span className="text-grayscale-text-negative">Belum diatur</span>
                  ) : (
                    formatRupiah(tutor.rate)
                  ),
                ],
                ["Pengambilan", tutor.pickup],
              ]}
            />
          </div>
        </>
      ) : null}
    </DetailScreen>
  )
}

export { ProfilTutor }
