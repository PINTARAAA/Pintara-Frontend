import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { FilterIcon, SearchIcon, UserIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { DataState } from "@/components/ui/data-state"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ListItem } from "@/components/ui/list-item"
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import {
  gradeLabel,
  registrationsQuery,
  type Level,
  type PengelolaRegistration,
  type RegistrationStatus,
} from "@/features/verifikasi/api/verifikasi"
import { formatDaysAgo } from "@/features/verifikasi/lib/format"
import { cn } from "@/lib/styles/cn"
import { usePengelolaUnreadNotifications } from "@/features/notifikasi/api/notifikasi-pengelola"

/*
 * P2 · Verifikasi Pendaftaran (tab pengelola) · Figma "Verifikasi
 * Pendaftaran / Daftar" dan "/ Kosong".
 *
 * Kolom cari (nama siswa atau wali) + tombol filter jenjang → tab Menunggu
 * (counter) · Terverifikasi · Ditolak → daftar pendaftar (ketuk → detail).
 * Tab, kata kunci, dan jenjang disimpan di ?tab=…&q=…&jenjang=….
 */
const TABS: { value: RegistrationStatus; param: string; label: string }[] = [
  { value: "menunggu_verifikasi", param: "menunggu", label: "Menunggu" },
  { value: "terverifikasi", param: "terverifikasi", label: "Terverifikasi" },
  { value: "ditolak", param: "ditolak", label: "Ditolak" },
]
const LEVELS: Level[] = ["SD", "SMP", "SMA"]
const ALL = "semua"

const EMPTY: Record<
  RegistrationStatus,
  { title: string; description: string }
> = {
  menunggu_verifikasi: {
    title: "Tidak ada pendaftar menunggu",
    description: "Pendaftaran baru dari wali murid akan muncul di sini.",
  },
  terverifikasi: {
    title: "Belum ada pendaftaran terverifikasi",
    description: "Pendaftaran yang Anda verifikasi akan muncul di sini.",
  },
  ditolak: {
    title: "Belum ada pendaftaran ditolak",
    description: "Pendaftaran yang Anda tolak akan muncul di sini.",
  },
}

function VerifikasiPendaftaran() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.param === params.get("tab")) ?? TABS[0]
  const query = params.get("q") ?? ""
  const levelParam = params.get("jenjang")?.toUpperCase()
  const level = LEVELS.find((l) => l === levelParam)

  const unread = usePengelolaUnreadNotifications()

  const list = useQuery({
    ...registrationsQuery({ status: tab.value, query, level }),
    placeholderData: keepPreviousData,
  })

  const update = (next: { tab?: string; q?: string; jenjang?: string }) => {
    const merged = {
      tab: next.tab ?? tab.param,
      q: next.q ?? query,
      jenjang: next.jenjang ?? level?.toLowerCase() ?? ALL,
    }
    const search = new URLSearchParams()
    if (merged.tab !== TABS[0].param) search.set("tab", merged.tab)
    if (merged.q.trim()) search.set("q", merged.q.trim())
    if (merged.jenjang !== ALL) search.set("jenjang", merged.jenjang)
    setParams(search, { replace: true })
  }

  const filtered = Boolean(query.trim() || level)

  return (
    <Tabs
      value={tab.param}
      onValueChange={(value) => update({ tab: value as string })}
      className="contents"
    >
      <TabScreen
        title="Pendaftaran"
        action={
          <NotificationButton to="/pengelola/notifikasi" unread={unread} />
        }
        subheader={
          <div className="gap-ns-s flex flex-col">
            <div className="gap-ns-s flex items-end">
              <SearchField value={query} onCommit={(q) => update({ q })} />
              <LevelFilter
                value={level}
                onValueChange={(v) => update({ jenjang: v })}
              />
            </div>
            <TabsList className="border-grayscale-border-default w-full border-b *:-mb-px">
              {TABS.map((t) => (
                <TabsTrigger key={t.param} value={t.param}>
                  {t.label}
                  {t.value === "menunggu_verifikasi" &&
                    (list.data?.counts.menunggu_verifikasi ?? 0) > 0 && (
                      <TabsCount>
                        {list.data?.counts.menunggu_verifikasi}
                      </TabsCount>
                    )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        }
      >
        {list.isPending ? (
          <DataState state="loading" loadingLabel="Memuat pendaftaran…" />
        ) : list.isError ? (
          <DataState
            state="error"
            title="Pendaftaran gagal dimuat"
            description="Periksa koneksi Anda, lalu coba lagi."
            action={{ label: "Coba lagi", onClick: () => list.refetch() }}
          />
        ) : list.data.items.length > 0 ? (
          <div
            aria-busy={list.isPlaceholderData}
            className={cn(
              "gap-ns-m flex flex-col transition-opacity lg:max-w-3xl",
              list.isPlaceholderData && "opacity-60"
            )}
          >
            <p className="text-caption text-grayscale-text-caption leading-normal">
              {tab.value === "menunggu_verifikasi"
                ? "Diurutkan dari yang paling lama menunggu"
                : "Diurutkan dari yang terbaru"}
            </p>
            <DashboardList>
              {list.data.items.map((r) => (
                <RegistrationItem key={r.id} registration={r} />
              ))}
            </DashboardList>
          </div>
        ) : filtered ? (
          <DataState
            state="empty"
            title="Pendaftaran tidak ditemukan"
            description="Tidak ada pendaftaran yang cocok dengan pencarian atau filter jenjang."
            action={{
              label: "Hapus pencarian & filter",
              onClick: () => update({ q: "", jenjang: ALL }),
            }}
          />
        ) : (
          <DataState state="empty" {...EMPTY[tab.value]} />
        )}
      </TabScreen>
    </Tabs>
  )
}

function RegistrationItem({
  registration: r,
}: {
  registration: PengelolaRegistration
}) {
  const when =
    r.status === "terverifikasi" && r.verifiedAt
      ? `diverifikasi ${formatDaysAgo(r.verifiedAt)}`
      : r.status === "ditolak" && r.rejection
        ? `ditolak ${formatDaysAgo(r.rejection.at)}`
        : formatDaysAgo(r.submittedAt)

  return (
    <ListItem
      icon={<UserIcon />}
      title={`${r.student.name} · ${gradeLabel(r.student)}`}
      description={`${r.needs.subjects.join(", ")} · Wali: ${r.parent.name} · ${when}`}
      chevron
      render={<Link to={`/pengelola/pendaftaran/${r.id}`} />}
    />
  )
}

/* Kolom cari: kata kunci diterapkan 300 ms setelah berhenti mengetik */
function SearchField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = React.useState(value)
  const commit = React.useEffectEvent((next: string) => onCommit(next))

  /* Ikuti perubahan dari luar (mis. tombol "Hapus pencarian") */
  const [synced, setSynced] = React.useState(value)
  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  React.useEffect(() => {
    if (draft.trim() === value.trim()) return
    const timer = window.setTimeout(() => commit(draft), 300)
    return () => window.clearTimeout(timer)
  }, [draft, value])

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        type="search"
        aria-label="Cari nama siswa atau wali"
        placeholder="Cari nama siswa atau wali"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="pr-12"
      />
      <SearchIcon
        aria-hidden="true"
        className="right-ns-l text-grayscale-text-body pointer-events-none absolute top-1/2 size-5 -translate-y-1/2"
      />
    </div>
  )
}

/* Tombol filter 48px: pilih jenjang, titik biru bila filter aktif */
function LevelFilter({
  value,
  onValueChange,
}: {
  value: Level | undefined
  onValueChange: (value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Filter jenjang: ${value ?? "Semua jenjang"}`}
        className="border-grayscale-border-default bg-grayscale-surface-default text-grayscale-text-body hover:border-grayscale-border-darker focus-visible:ring-primary-border-lighter data-popup-open:border-primary-border-default relative flex size-12 shrink-0 items-center justify-center rounded-(--comp-radius-md) border outline-none focus-visible:ring-2"
      >
        <FilterIcon aria-hidden="true" className="size-5" />
        {value && (
          <span
            aria-hidden="true"
            className="bg-primary-surface-default absolute top-2.5 right-2.5 size-2 rounded-full"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Jenjang</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value?.toLowerCase() ?? ALL}
            onValueChange={(v) => onValueChange(v as string)}
          >
            <DropdownMenuRadioItem value={ALL} className="min-h-12">
              Semua jenjang
            </DropdownMenuRadioItem>
            {LEVELS.map((l) => (
              <DropdownMenuRadioItem
                key={l}
                value={l.toLowerCase()}
                className="min-h-12"
              >
                {l}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { VerifikasiPendaftaran }
