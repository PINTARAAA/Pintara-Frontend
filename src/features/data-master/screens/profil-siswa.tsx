import { useQuery } from "@tanstack/react-query"
import { CalendarIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import { DetailScreen, Button, DataState } from "@/components"
import {
  initialsOf,
  NotFoundError,
  setStudentStatus,
  studentQuery,
} from "@/features/data-master/api/data-master"
import {
  InfoCard,
  ProfileHeader,
  ProfileMenu,
  StatusToggle,
} from "@/features/data-master/components/profile-parts"

/*
 * P9 · Profil Siswa · Figma "Data Siswa / Profil".
 *
 * Identitas (kelas · sekolah, status) → Data siswa (alamat les, mapel,
 * kebutuhan belajar) → Wali & akun → Les aktif (mapel · hari, jam · tutor).
 * Bilah aksi: Nonaktifkan (ditolak bila masih ada les aktif) · Ubah Profil.
 */
function ProfilSiswa() {
  const { studentId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(studentQuery(studentId))
  const student = query.data

  return (
    <DetailScreen
      title="Profil Siswa"
      action={
        student && (
          <ProfileMenu
            items={[
              {
                label: "Lihat jadwal les",
                onClick: () => navigate("/pengelola/les?tab=jadwal"),
              },
              {
                label: "Lihat tagihan",
                onClick: () => navigate("/pengelola/laporan-keuangan/tagihan"),
              },
            ]}
          />
        )
      }
      footer={
        student && (
          <>
            <StatusToggle
              status={student.status}
              shortName={student.name.split(" ")[0]}
              queryKey={["data-master", "siswa"]}
              scheduleHint="Hentikan atau selesaikan les tersebut"
              deactivateNote="Siswa tidak lagi mendapat jadwal dan tagihan baru. Riwayat les dan pembayaran tetap tersimpan."
              activeSchedules={student.lessons.length}
              onChange={(status) => setStudentStatus(student.id, status)}
            />
            <Button
              nativeButton={false}
              /* SEMENTARA: layar Ubah Profil Siswa belum ada di Figma */
              render={<Link to={`/pengelola/siswa/${student.id}/ubah`} />}
            >
              Ubah Profil
            </Button>
          </>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat profil siswa…" />
      ) : query.isError ? (
        query.error instanceof NotFoundError ? (
          <DataState
            state="empty"
            title="Siswa tidak ditemukan"
            description="Data siswa ini mungkin sudah dihapus atau tautannya keliru."
            action={{
              label: "Kembali ke Data Siswa",
              onClick: () => navigate("/pengelola/siswa", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Profil siswa gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : student ? (
        <>
          <ProfileHeader
            name={student.name}
            initials={initialsOf(student.name)}
            caption={`Kelas ${student.grade} · ${student.school}`}
            status={student.status}
          />
          <InfoCard
            title="Data siswa"
            rows={[
              ["Alamat les", student.address],
              ["Mata pelajaran", student.subjects.join(", ")],
              ["Kebutuhan belajar", student.needs],
            ]}
          />
          <InfoCard
            title="Wali & akun"
            rows={[
              ["Wali", student.guardian.name],
              ["WhatsApp", student.guardian.phone],
              [
                "Akun wali",
                `${student.guardian.accountActive ? "Aktif" : "Belum aktif"} · tertaut ke ${student.guardian.linkedStudents} siswa`,
              ],
            ]}
          />
          <InfoCard title="Les aktif">
            {student.lessons.length > 0 ? (
              <ul className="gap-ns-m flex flex-col">
                {student.lessons.map((l) => (
                  <li
                    key={`${l.subject}-${l.day}`}
                    className="gap-ns-m bg-grayscale-surface-subtitle px-ns-l py-ns-m flex items-center rounded-(--comp-radius-md) leading-normal"
                  >
                    <CalendarIcon
                      aria-hidden="true"
                      className="text-grayscale-text-title size-5 shrink-0"
                    />
                    <div className="gap-ns-2xs flex min-w-0 flex-col">
                      <p className="text-subtitle leading-normal text-grayscale-text-title font-bold">
                        {l.subject} · setiap {l.day}
                      </p>
                      <p className="text-caption leading-normal text-grayscale-text-caption">
                        {l.from}–{l.until} · {l.tutorName}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-subtitle text-grayscale-text-caption leading-normal">
                {student.status === "nonaktif"
                  ? "Siswa sudah tidak mengikuti les."
                  : "Belum ada les aktif. Cocokkan tutor di menu Les."}
              </p>
            )}
          </InfoCard>
        </>
      ) : null}
    </DetailScreen>
  )
}

export { ProfilSiswa }
