import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PlusIcon, UserIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { StatusBadge } from "@/components/ui/badge"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { TopAppBarButton } from "@/components/ui/top-app-bar"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import {
  STUDENT_SUBJECTS,
  studentsQuery,
  type StudentRow,
} from "@/features/data-master/api/data-master"
import { MasterFilters } from "@/features/data-master/components/master-filters"
import { useMasterFilter } from "@/features/data-master/hooks/use-master-filter"
import { cn } from "@/lib/styles/cn"

/*
 * P9 · Data Siswa · Figma "Data Siswa / Daftar".
 *
 * Kolom cari nama siswa/wali + pil Mata pelajaran · Lokasi · Status →
 * "N siswa ditemukan" → daftar (kelas · mapel · tutor / "belum ada tutor";
 * nonaktif: "selesai <bulan>" + badge). Tombol + → Tambah Siswa.
 */
const shortTutor = (name: string) => name.split(" ").slice(0, 2).join(" ")

function describe(s: StudentRow) {
  const grade = `Kelas ${s.grade}`
  if (s.status === "nonaktif") {
    return [
      grade,
      s.endedAt
        ? `selesai ${format(s.endedAt, "MMM yyyy", { locale: localeId })}`
        : "nonaktif",
    ].join(" · ")
  }
  return [
    grade,
    s.subjects.join(", "),
    s.tutorNames.length > 0
      ? s.tutorNames.map(shortTutor).join(", ")
      : "belum ada tutor",
  ].join(" · ")
}

function DataSiswa() {
  const navigate = useNavigate()
  const { filter, update, reset, filtered } = useMasterFilter()
  const query = useQuery({
    ...studentsQuery(filter),
    placeholderData: keepPreviousData,
  })

  return (
    <DetailScreen
      title="Data Siswa"
      action={
        <TopAppBarButton
          label="Tambah siswa"
          variant="plain"
          className="text-primary-surface-default"
          /* SEMENTARA: layar Tambah Siswa belum ada di Figma */
          onClick={() => navigate("/pengelola/siswa/tambah")}
        >
          <PlusIcon />
        </TopAppBarButton>
      }
      subheader={
        <MasterFilters
          searchLabel="Cari nama siswa atau wali"
          subjects={STUDENT_SUBJECTS}
          filter={filter}
          onChange={update}
        />
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat data siswa…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Data siswa gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : query.data.length === 0 ? (
        <DataState
          state="empty"
          title={filtered ? "Siswa tidak ditemukan" : "Belum ada siswa"}
          description={
            filtered
              ? "Tidak ada siswa yang cocok dengan pencarian atau filter."
              : "Siswa dari pendaftaran yang terverifikasi akan muncul di sini."
          }
          action={
            filtered
              ? { label: "Hapus pencarian & filter", onClick: reset }
              : undefined
          }
        />
      ) : (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "gap-ns-m flex flex-col transition-opacity",
            query.isPlaceholderData && "opacity-60"
          )}
        >
          <p className="text-caption text-grayscale-text-caption leading-normal">
            {query.data.length} siswa ditemukan
          </p>
          <DashboardList>
            {query.data.map((s) => (
              <ListItem
                key={s.id}
                icon={<UserIcon />}
                title={s.name}
                description={describe(s)}
                badge={
                  s.status === "nonaktif" ? (
                    <StatusBadge category="akun" status="nonaktif" />
                  ) : undefined
                }
                chevron
                render={<Link to={`/pengelola/siswa/${s.id}`} />}
              />
            ))}
          </DashboardList>
        </div>
      )}
    </DetailScreen>
  )
}

export { DataSiswa }
