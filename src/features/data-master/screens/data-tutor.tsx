import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PlusIcon, UserIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  DataState,
  ListItem,
  TopAppBarButton,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import {
  formatLevels,
  TUTOR_SUBJECTS,
  tutorsQuery,
} from "@/features/data-master/api"
import { MasterFilters } from "@/features/data-master/components"
import { useMasterFilter } from "@/features/data-master/hooks"
import { cn } from "@/lib/styles/cn"

/*
 * P9 · Data Tutor · Figma "Data Tutor / Daftar".
 *
 * Kolom cari nama + pil Mata pelajaran · Lokasi · Status → "N tutor
 * ditemukan" → daftar (mapel · jenjang · kecamatan; tarif belum diatur
 * ditandai; nonaktif = badge). Tombol + → Tambah Tutor.
 */
function DataTutor() {
  const navigate = useNavigate()
  const { filter, update, reset, filtered } = useMasterFilter()
  const query = useQuery({
    ...tutorsQuery(filter),
    placeholderData: keepPreviousData,
  })

  return (
    <DetailScreen
      title="Data Tutor"
      action={
        <TopAppBarButton
          label="Tambah tutor"
          variant="plain"
          className="text-primary-surface-default"
          onClick={() => navigate("/pengelola/tutor/tambah")}
        >
          <PlusIcon />
        </TopAppBarButton>
      }
      subheader={
        <MasterFilters
          searchLabel="Cari nama tutor"
          subjects={TUTOR_SUBJECTS}
          filter={filter}
          onChange={update}
        />
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat data tutor…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Data tutor gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : query.data.length === 0 ? (
        <DataState
          state="empty"
          title={filtered ? "Tutor tidak ditemukan" : "Belum ada tutor"}
          description={
            filtered
              ? "Tidak ada tutor yang cocok dengan pencarian atau filter."
              : "Tutor yang Anda tambahkan akan muncul di sini."
          }
          action={
            filtered
              ? { label: "Hapus pencarian & filter", onClick: reset }
              : {
                  label: "Tambah tutor",
                  onClick: () => navigate("/pengelola/tutor/tambah"),
                }
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
            {query.data.length} tutor ditemukan
          </p>
          <DashboardList>
            {query.data.map((t) => (
              <ListItem
                key={t.id}
                icon={<UserIcon />}
                title={t.name}
                description={[
                  t.subjects.join(", "),
                  formatLevels(t.levels),
                  t.district,
                  ...(t.rate === null ? ["tarif belum diatur"] : []),
                ].join(" · ")}
                badge={
                  t.status === "nonaktif" ? (
                    <StatusBadge category="akun" status="nonaktif" />
                  ) : undefined
                }
                chevron
                render={<Link to={`/pengelola/tutor/${t.id}`} />}
              />
            ))}
          </DashboardList>
        </div>
      )}
    </DetailScreen>
  )
}

export { DataTutor }
