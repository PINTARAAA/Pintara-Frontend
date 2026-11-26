import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Link, useNavigate, useParams } from "react-router"

import { DetailScreen, Button, DataState } from "@/components"
import {
  formatDays,
  formatLevelsLong,
  initialsOf,
  NotFoundError,
  SERVICE_RADIUS_KM,
  setTutorStatus,
  tutorQuery,
} from "@/features/data-master/api"
import {
  InfoCard,
  ProfileHeader,
  ProfileMenu,
  StatusToggle,
} from "@/features/data-master/components"
import { formatRupiah } from "@/lib/format/currency"

/*
 * P9 · Profil Tutor · Figma "Data Tutor / Profil" dan "Tidak bisa
 * dinonaktifkan".
 *
 * Identitas (sejak, siswa aktif, status) → Kontak → Kualifikasi →
 * Ketersediaan & lokasi → Honor. Bilah aksi: Nonaktifkan (ditolak bila
 * masih ada jadwal aktif) · Ubah Profil.
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
        query.error instanceof NotFoundError ? (
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
                  <span className="text-error">Belum diatur</span>
                ) : (
                  formatRupiah(tutor.rate)
                ),
              ],
              ["Pengambilan", tutor.pickup],
            ]}
          />
        </>
      ) : null}
    </DetailScreen>
  )
}

export { ProfilTutor }
