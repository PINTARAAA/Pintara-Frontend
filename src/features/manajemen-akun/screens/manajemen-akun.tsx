import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PlusIcon, SearchIcon, UserIcon } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"

import {
  DetailScreen,
  Button,
  StatusBadge,
  DataState,
  Input,
  ListItem,
  Tabs,
  TabsContent,
  TabsCount,
  TabsList,
  TabsTrigger,
  TopAppBarButton,
} from "@/components"
import { MasterList } from "@/features/data-master/components"
import { accountsQuery } from "@/features/manajemen-akun/api"
import type {
  AccountList,
  AccountRole,
  AccountRow,
} from "@/types/manajemen-akun"
import { cn } from "@/lib/styles"

/*
 * P10 · Manajemen Akun · Figma "Manajemen Akun / Daftar".
 *
 * Kolom cari (nama, email, username) → tab Wali · Tutor · Pengelola dengan
 * jumlah → daftar akun (email · siswa tertaut; nonaktif = badge). Tombol +
 * → Tambah Akun (peran mengikuti tab). Disimpan di ?peran=…&q=….
 *
 * Desktop (Figma "Manajemen Akun / Daftar (Desktop)"): Page header tanpa
 * tautan kembali dengan tombol Tambah Akun; tab (420px) di kiri dan kolom
 * cari (360px) di kanan dalam satu baris; daftar selebar konten.
 */
const ROLES: { value: AccountRole; label: string }[] = [
  { value: "wali", label: "Wali" },
  { value: "tutor", label: "Tutor" },
  { value: "pengelola", label: "Pengelola" },
]

function describe(a: AccountRow) {
  if (a.role !== "wali") return a.email
  return `${a.email} · ${a.students > 0 ? `${a.students} siswa tertaut` : "belum tertaut ke siswa"}`
}

function ManajemenAkun() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const role =
    ROLES.find((r) => r.value === params.get("peran"))?.value ?? "wali"
  const query = params.get("q") ?? ""
  const list = useQuery({
    ...accountsQuery(role, query),
    placeholderData: keepPreviousData,
  })

  const update = (next: { peran?: string; q?: string }) => {
    const merged = { peran: next.peran ?? role, q: next.q ?? query }
    const search = new URLSearchParams()
    if (merged.peran !== "wali") search.set("peran", merged.peran)
    if (merged.q.trim()) search.set("q", merged.q.trim())
    setParams(search, { replace: true })
  }

  return (
    <Tabs
      value={role}
      onValueChange={(v) => update({ peran: v as string })}
      className="contents"
    >
      <DetailScreen
        title="Manajemen Akun"
        backLabel={null}
        desktopHeader="page"
        desktopWidth="wide"
        desktopHeaderActions={
          <Button
            onClick={() => navigate(`/pengelola/akun/tambah?peran=${role}`)}
          >
            Tambah Akun
          </Button>
        }
        action={
          /* Ikon + khusus mobile; desktop memakai tombol di Page header */
          <TopAppBarButton
            label="Tambah akun"
            variant="plain"
            className="text-primary-text-link lg:hidden"
            onClick={() => navigate(`/pengelola/akun/tambah?peran=${role}`)}
          >
            <PlusIcon />
          </TopAppBarButton>
        }
        subheader={
          <div className="gap-ns-s lg:gap-ns-2xl flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <SearchField value={query} onCommit={(q) => update({ q })} />
            <TabsList className="border-grayscale-border-default -mb-ns-m w-full border-b *:-mb-px lg:order-first lg:mb-0 lg:w-105">
              {ROLES.map((r) => (
                <TabsTrigger key={r.value} value={r.value}>
                  {r.label}
                  {list.data && (
                    <TabsCount>{list.data.counts[r.value]}</TabsCount>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        }
      >
        {ROLES.map((r) => (
          <TabsContent key={r.value} value={r.value} className="flex flex-col">
            {list.isPending ? (
              <DataState state="loading" loadingLabel="Memuat akun…" />
            ) : list.isError ? (
              <DataState
                state="error"
                title="Daftar akun gagal dimuat"
                description="Periksa koneksi Anda, lalu coba lagi."
                action={{ label: "Coba lagi", onClick: () => list.refetch() }}
              />
            ) : (
              <AccountItems
                /* Kembali ringkas saat tab atau kata kunci berubah */
                key={`${role}:${query}`}
                data={list.data}
                busy={list.isPlaceholderData}
                searching={!!query.trim()}
                onClear={() => update({ q: "" })}
              />
            )}
          </TabsContent>
        ))}
      </DetailScreen>
    </Tabs>
  )
}

function AccountItems({
  data,
  busy,
  searching,
  onClear,
}: {
  data: AccountList
  busy: boolean
  searching: boolean
  onClear: () => void
}) {
  if (data.items.length === 0) {
    return (
      <DataState
        state="empty"
        title={searching ? "Akun tidak ditemukan" : "Belum ada akun"}
        description={
          searching
            ? "Tidak ada akun yang cocok dengan nama, email, atau username tersebut."
            : "Akun yang Anda buat akan muncul di sini."
        }
        action={
          searching ? { label: "Hapus pencarian", onClick: onClear } : undefined
        }
      />
    )
  }
  return (
    <div
      aria-busy={busy}
      className={cn(
        "gap-ns-m flex flex-col transition-opacity",
        busy && "opacity-60"
      )}
    >
      {/* 10 baris pertama; sisanya lewat "Lihat N akun lainnya" (sama
          seperti Data Tutor / Data Siswa) */}
      <MasterList
        items={data.items}
        noun="akun"
        renderItem={(a) => (
          <ListItem
            key={a.id}
            icon={<UserIcon />}
            title={a.name}
            description={<span className="break-all">{describe(a)}</span>}
            badge={
              a.status === "nonaktif" ? (
                <StatusBadge category="akun" status="nonaktif" />
              ) : undefined
            }
            chevron
            render={<Link to={`/pengelola/akun/${a.id}`} />}
          />
        )}
      />
    </div>
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
    <div className="relative lg:w-90 lg:shrink-0">
      <Input
        type="search"
        aria-label="Cari nama, email, atau username"
        placeholder="Cari nama, email, atau username"
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

export { ManajemenAkun }
