import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PlusIcon, UserIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"

import {
  DetailScreen,
  Button,
  StatusBadge,
  DataState,
  ListItem,
  TopAppBarButton,
} from "@/components"
import { formatLevels, tutorsQuery } from "@/features/data-master/api"
import { TUTOR_SUBJECTS } from "@/lib/data/data-master"
import { MasterFilters, MasterList } from "@/features/data-master/components"
import { useMasterFilter } from "@/features/data-master/hooks"
import { cn } from "@/lib/styles"

/*
 * P9 · Data Tutor · Figma "Data Tutor / Daftar".
 *
 * Kolom cari nama + pil Mata pelajaran · Lokasi · Status → "N tutor
 * ditemukan" → daftar (mapel · jenjang · kecamatan; tarif belum diatur
 * ditandai; nonaktif = badge). Tombol + → Tambah Tutor.
 *
 * Desktop (Figma "Data Tutor / Daftar (Desktop)"): Page header tanpa
 * tautan kembali dengan tombol Tambah Tutor; cari + pil satu baris; daftar
 * selebar konten.
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
      backLabel={null}
      desktopHeader="page"
      desktopWidth="wide"
      desktopHeaderActions={
        <Button onClick={() => navigate("/pengelola/tutor/tambah")}>
          Tambah Tutor
        </Button>
      }
      action={
        /* Ikon + khusus mobile; desktop memakai tombol di Page header */
        <TopAppBarButton
          label="Tambah tutor"
          variant="plain"
          className="text-primary-text-link lg:hidden"
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
          {/* 10 baris pertama; sisanya lewat "Lihat N tutor lainnya" */}
          <MasterList
            key={JSON.stringify(filter)}
            items={query.data}
            noun="tutor"
            renderItem={(t) => (
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
            )}
          />
        </div>
      )}
    </DetailScreen>
  )
}

export { DataTutor }
