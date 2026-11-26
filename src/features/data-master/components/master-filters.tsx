import * as React from "react"
import { SearchIcon } from "lucide-react"

import { FilterChip, FilterPill, Input } from "@/components"
import { DISTRICTS } from "@/lib/data/data-master"
import type { MasterFilter } from "@/types/data-master"
import { ALL } from "@/features/data-master/hooks"

/*
 * P9 · "Search & filters" pada Data Tutor / Data Siswa: kolom cari lalu
 * baris pil Mata pelajaran · Lokasi · Status (bisa digeser horizontal).
 * Nilai disimpan di ?q=…&mapel=…&lokasi=…&status=….
 *
 * Desktop (Figma "… / Daftar (Desktop)"): kolom cari 360px dan pil dalam
 * satu baris, pil tidak lagi digeser.
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
    <div className="gap-ns-m lg:gap-ns-l flex flex-col lg:flex-row lg:items-center">
      <SearchField
        label={searchLabel}
        value={filter.query ?? ""}
        onCommit={(q) => onChange("q", q)}
      />
      {/*
       * Filter aktif tampil sebagai FilterChip dengan tombol × untuk
       * menghapusnya (sama seperti Rekap & Riwayat Les dan Riwayat
       * Notifikasi); filter belum dipakai tampil sebagai FilterPill.
       */}
      <div className="gap-ns-s -mx-(--gutter) px-(--gutter) flex overflow-x-auto [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0">
        {filter.subject ? (
          <FilterChip
            label={filter.subject}
            onClear={() => onChange("mapel", ALL)}
          />
        ) : (
          <FilterPill
            label="Mata pelajaran"
            menuLabel="Pilih mata pelajaran"
            triggerLabel="Mata pelajaran"
            value={ALL}
            options={[
              { value: ALL, label: "Semua mata pelajaran" },
              ...subjects.map((s) => ({ value: s, label: s })),
            ]}
            onValueChange={(v) => onChange("mapel", v)}
          />
        )}
        {filter.district ? (
          <FilterChip
            label={`Kec. ${filter.district}`}
            onClear={() => onChange("lokasi", ALL)}
          />
        ) : (
          <FilterPill
            label="Lokasi"
            menuLabel="Pilih kecamatan"
            triggerLabel="Lokasi"
            value={ALL}
            options={[
              { value: ALL, label: "Semua lokasi" },
              ...DISTRICTS.map((d) => ({ value: d, label: `Kec. ${d}` })),
            ]}
            onValueChange={(v) => onChange("lokasi", v)}
          />
        )}
        {filter.status ? (
          <FilterChip
            label={filter.status === "aktif" ? "Aktif" : "Nonaktif"}
            onClear={() => onChange("status", ALL)}
          />
        ) : (
          <FilterPill
            label="Status"
            menuLabel="Pilih status"
            triggerLabel="Status"
            value={ALL}
            options={[
              { value: ALL, label: "Semua status" },
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif" },
            ]}
            onValueChange={(v) => onChange("status", v)}
          />
        )}
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
    <div className="relative lg:w-90 lg:shrink-0">
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
