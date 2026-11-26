import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronRightIcon } from "lucide-react"
import { Link } from "react-router"

import { DetailScreen, DataState, Switch, toast } from "@/components"
import {
  describeSetting,
  notificationSettingsQuery,
  saveNotificationSetting,
} from "@/features/pengaturan-notifikasi/api"
import type { NotificationSetting } from "@/types/pengaturan-notifikasi"

/*
 * P12 · Pengaturan Notifikasi · Figma "Pengaturan Notifikasi / Daftar" dan
 * "Tersimpan".
 *
 * Pengingat otomatis (jadwal les, presensi) dan Notifikasi kejadian. Tiap
 * baris: judul, penerima · waktu/pemicu, Switch aktif (langsung tersimpan),
 * chevron → layar ubah waktu & template.
 *
 * Desktop (Figma "… / Daftar (Desktop)" dan "Tersimpan (Desktop)"): Page
 * header tanpa tautan kembali; dua grup berdampingan (dua kolom sama
 * lebar, jarak 32).
 */
function PengaturanNotifikasi() {
  const query = useQuery(notificationSettingsQuery())

  return (
    <DetailScreen
      title="Pengaturan Notifikasi"
      backLabel={null}
      desktopHeader="page"
      desktopWidth="wide"
      className="gap-ns-2xl"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pengaturan…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Pengaturan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <div className="gap-ns-2xl lg:gap-ns-3xl flex flex-col lg:grid lg:grid-cols-2 lg:items-start">
          <SettingGroup
            title="Pengingat otomatis"
            description="Dikirim terjadwal oleh sistem. Ketuk untuk mengubah waktu dan template."
            items={query.data.filter((s) => s.group === "pengingat")}
          />
          <SettingGroup
            title="Notifikasi kejadian"
            description="Dikirim saat ada kejadian di sistem."
            items={query.data.filter((s) => s.group === "kejadian")}
          />
        </div>
      )}
    </DetailScreen>
  )
}

function SettingGroup({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: NotificationSetting[]
}) {
  return (
    <section className="gap-ns-m flex flex-col">
      <div className="gap-ns-2xs flex flex-col">
        <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
          {title}
        </h2>
        <p className="text-caption text-grayscale-text-caption leading-normal">
          {description}
        </p>
      </div>
      <ul className="border-grayscale-border-default bg-grayscale-surface-default flex flex-col overflow-hidden rounded-(--comp-radius-md) border">
        {items.map((s) => (
          <SettingRow key={s.id} setting={s} />
        ))}
      </ul>
    </section>
  )
}

/*
 * Baris pengaturan: area teks & chevron = tautan ke layar ubah, Switch
 * berdiri sendiri (bukan di dalam tautan) agar keduanya bisa difokus.
 */
function SettingRow({ setting: s }: { setting: NotificationSetting }) {
  const queryClient = useQueryClient()
  const key = notificationSettingsQuery().queryKey
  const to = `/pengelola/pengaturan-notifikasi/${s.id}`

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => saveNotificationSetting(s.id, { enabled }),
    networkMode: "always",
    /* Optimistis: switch langsung berpindah, dikembalikan bila gagal */
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (list) =>
        list?.map((item) => (item.id === s.id ? { ...item, enabled } : item))
      )
      return { previous }
    },
    onSuccess: (updated) =>
      toast.success(
        `${updated.title} ${updated.enabled ? "diaktifkan" : "dinonaktifkan"}`
      ),
    onError: (_, __, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error("Pengaturan gagal disimpan", {
        description: "Periksa koneksi Anda, lalu coba lagi.",
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pengaturan-notifikasi"] }),
  })

  return (
    <li className="border-grayscale-border-disabled hover:bg-grayscale-surface-subtitle relative flex items-center transition-colors not-last:border-b">
      <Link
        to={to}
        className="gap-ns-2xs py-ns-m pl-ns-l pr-ns-m focus-visible:ring-primary-border-lighter flex min-w-0 flex-1 flex-col leading-normal outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <span className="text-subtitle leading-normal text-grayscale-text-title font-bold">
          {s.title}
        </span>
        <span className="text-caption leading-normal text-grayscale-text-caption">
          {describeSetting(s)}
        </span>
      </Link>
      <Switch
        aria-label={`${s.title} ${s.enabled ? "aktif" : "nonaktif"}`}
        checked={s.enabled}
        onCheckedChange={(checked) => toggle.mutate(checked)}
        disabled={toggle.isPending}
      />
      <Link
        to={to}
        tabIndex={-1}
        aria-hidden="true"
        className="py-ns-m pr-ns-l pl-ns-m text-grayscale-text-title self-stretch flex items-center"
      >
        <ChevronRightIcon className="size-5" />
      </Link>
    </li>
  )
}

export { PengaturanNotifikasi }
