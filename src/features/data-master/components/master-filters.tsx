import * as React from "react"
import { SearchIcon } from "lucide-react"

import { FilterPill, Input } from "@/components"
import {
  DISTRICTS,
  type MasterFilter,
} from "@/features/data-master/api/data-master"
import { ALL } from "@/features/data-master/hooks/use-master-filter"

/*
 * P9 · "Search & filters" pada Data Tutor / Data Siswa: kolom cari lalu
 * baris pil Mata pelajaran · Lokasi · Status (bisa digeser horizontal).
 * Nilai disimpan di ?q=…&mapel=…&lokasi=…&status=….
 */
function MasterFilters({
  searchLabel,
  subjects,
  filter,
  onChange,
}: {
  searchLabel: string
  subjects: readonly string[]
  filter: MasterFilter
  onChange: (key: "q" | "mapel" | "lokasi" | "status", value: string) => void
}) {
  return (
    <div className="gap-ns-m flex flex-col">
      <SearchField
        label={searchLabel}
        value={filter.query ?? ""}
        onCommit={(q) => onChange("q", q)}
      />
      <div className="gap-ns-s -mx-(--gutter) px-(--gutter) flex overflow-x-auto [scrollbar-width:none]">
        <FilterPill
          label="Mata pelajaran"
          menuLabel="Pilih mata pelajaran"
          triggerLabel={filter.subject ?? "Mata pelajaran"}
          active={!!filter.subject}
          value={filter.subject ?? ALL}
          options={[
            { value: ALL, label: "Semua mata pelajaran" },
            ...subjects.map((s) => ({ value: s, label: s })),
          ]}
          onValueChange={(v) => onChange("mapel", v)}
        />
        <FilterPill
          label="Lokasi"
          menuLabel="Pilih kecamatan"
          triggerLabel={filter.district ?? "Lokasi"}
          active={!!filter.district}
          value={filter.district ?? ALL}
          options={[
            { value: ALL, label: "Semua lokasi" },
            ...DISTRICTS.map((d) => ({ value: d, label: `Kec. ${d}` })),
          ]}
          onValueChange={(v) => onChange("lokasi", v)}
        />
        <FilterPill
          label="Status"
          menuLabel="Pilih status"
          triggerLabel={
            filter.status === "aktif"
              ? "Aktif"
              : filter.status === "nonaktif"
                ? "Nonaktif"
                : "Status"
          }
          active={!!filter.status}
          value={filter.status ?? ALL}
          options={[
            { value: ALL, label: "Semua status" },
            { value: "aktif", label: "Aktif" },
            { value: "nonaktif", label: "Nonaktif" },
          ]}
          onValueChange={(v) => onChange("status", v)}
        />
      </div>
    </div>
  )
}

/* Kolom cari: kata kunci diterapkan 300 ms setelah berhenti mengetik */
function SearchField({
  label,
  value,
  onCommit,
}: {
  label: string
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
    <div className="relative">
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
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

export { MasterFilters }
