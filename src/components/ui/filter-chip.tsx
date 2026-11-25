import { XIcon } from "lucide-react"

/*
 * FilterChip · filter yang sedang aktif pada baris filter (P11 Rekap & Riwayat
 * Les, P13 Riwayat Notifikasi): pil Primary/Surface/subtitle ber-border
 * primary, label Subtitle/Bold + tombol × untuk menghapus filter.
 */
function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="gap-ns-s border-primary-border-default bg-primary-surface-subtitle py-ns-s pr-ns-s pl-ns-m text-subtitle text-primary-text-primary inline-flex shrink-0 items-center rounded-full border leading-normal font-bold">
      {label}
      <button
        type="button"
        aria-label={`Hapus filter ${label}`}
        onClick={onClear}
        className="hover:bg-primary-surface-default/10 focus-visible:ring-primary-border-lighter -m-ns-2xs p-ns-2xs rounded-full outline-none focus-visible:ring-2"
      >
        <XIcon aria-hidden="true" className="size-4" />
      </button>
    </span>
  )
}

export { FilterChip }
