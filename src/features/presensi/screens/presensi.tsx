import type * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ClipboardCheckIcon, ClockIcon } from "lucide-react"
import { Link } from "react-router"

import {
  TabScreen,
  StatusBadge,
  Button,
  DataState,
  ListItem,
} from "@/components"
import {
  DashboardList,
  DashboardSection,
  NotificationButton,
} from "@/features/dashboard/components"

import { useTutorUnreadNotifications } from "@/features/notifikasi/api"
import { useExpandable } from "@/hooks"
import { tutorSessionsQuery } from "@/features/presensi/api"
import { formatToFill, sessionTitle } from "@/features/presensi/lib"
import { formatTimeRange, formatWeekdayDate } from "@/lib/format"

/*
 * T2 · Presensi (tab tutor) · Figma "Presensi / Daftar" dan "Presensi / Kosong"
 *
 * Perlu diisi (sesi sudah dimulai, belum dipresensi; ketuk → form) ·
 * Nanti hari ini (belum bisa diisi) · Sudah diisi (badge status validasi
 * wali; tautan "Status presensi" ke T3).
 *
 * Desktop (≥ lg, frame "Presensi / Daftar (Desktop)" dan "- Kosong
 * (Desktop)"): halaman putih, Page header "Presensi" (lonceng di sidebar);
 * Perlu diisi + Nanti hari ini di kolom utama (jarak 32), Sudah diisi 420px
 * di kanan (jarak 40). Kosong: kartu Data state di tengah halaman.
 *
 * Tiap bagian hanya menampilkan PREVIEW baris pertama; sisanya dibuka lewat
 * "Lihat selengkapnya" · "Ringkas" agar halaman tidak perlu digulir panjang
 * (tambahan di luar Figma).
 */
const PREVIEW = 3
function Presensi() {
  const query = useQuery(tutorSessionsQuery())
  const data = query.data
  const unread = useTutorUnreadNotifications()

  return (
    <TabScreen
      title="Presensi"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat sesi les…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Sesi les gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div className="flex flex-1 flex-col gap-ns-2xl lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-x-ns-4xl">
          {data.toFill.length + data.laterToday.length === 0 ? (
            <div className="flex flex-1 flex-col justify-center gap-ns-l lg:col-span-2">
              <DataState
                state="empty"
                title="Tidak ada jadwal les hari ini"
                description="Presensi bisa diisi saat ada sesi les yang terjadwal."
              />
              <Button
                variant="tertiary"
                className="self-center"
                nativeButton={false}
                render={<Link to="/tutor/jadwal" />}
              >
                Lihat jadwal minggu ini
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-ns-2xl lg:gap-ns-3xl">
              {data.toFill.length > 0 && (
                <DashboardSection title="Perlu diisi">
                  <PreviewList
                    items={data.toFill}
                    renderItem={(s) => (
                      <ListItem
                        key={s.id}
                        icon={<ClipboardCheckIcon />}
                        title={sessionTitle(s)}
                        description={formatToFill(s)}
                        chevron
                        render={<Link to={`/tutor/presensi/${s.id}`} />}
                      />
                    )}
                  />
                </DashboardSection>
              )}
              {data.laterToday.length > 0 && (
                <DashboardSection title="Nanti hari ini">
                  <PreviewList
                    items={data.laterToday}
                    renderItem={(s) => (
                      <ListItem
                        key={s.id}
                        icon={<ClockIcon />}
                        title={sessionTitle(s)}
                        description={`${formatTimeRange(s.start, s.end)} · bisa diisi setelah sesi dimulai`}
                      />
                    )}
                  />
                </DashboardSection>
              )}
            </div>
          )}

          {data.filled.length > 0 && (
            <DashboardSection
              title="Sudah diisi"
              action={{ label: "Status presensi", to: "/tutor/presensi/status" }}
            >
              <PreviewList
                items={data.filled}
                renderItem={(s) => (
                  <ListItem
                    key={s.id}
                    icon={<ClipboardCheckIcon />}
                    title={sessionTitle(s)}
                    description={formatWeekdayDate(s.start)}
                    badge={
                      s.record && (
                        <StatusBadge category="presensi" status={s.record.validation} />
                      )
                    }
                    render={<Link to={`/tutor/presensi/status/${s.id}`} />}
                  />
                )}
              />
            </DashboardSection>
          )}
        </div>
      ) : null}
    </TabScreen>
  )
}

/* Daftar ringkas: PREVIEW baris pertama + tombol "Lihat selengkapnya" */
function PreviewList<T>({
  items,
  renderItem,
}: {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}) {
  const list = useExpandable(items, PREVIEW)

  return (
    <>
      <DashboardList>{list.visible.map(renderItem)}</DashboardList>
      {list.hidden > 0 && (
        <Button
          variant="tertiary"
          size="sm"
          className="-mt-ns-2xs w-fit self-center"
          aria-expanded={list.expanded}
          onClick={list.toggle}
        >
          {list.expanded
            ? "Ringkas"
            : `Lihat selengkapnya (${list.hidden} lainnya)`}
        </Button>
      )}
    </>
  )
}

export { Presensi }
