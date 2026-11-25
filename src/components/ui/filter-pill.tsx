import { ChevronDownIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/*
 * FilterPill · "Filter / …" pada Riwayat Les (W7)
 * dan Status Presensi tutor (T3): pil putih ber-border,
 * padding 12/8, teks Subtitle/Bold + chevron 16px. Membuka Dropdown pilihan
 * tunggal. Bila hanya ada satu pilihan, tampil sebagai label biasa.
 * `triggerLabel` mengganti teks pil (mis. "Mata pelajaran" saat belum
 * difilter); `active` menandai filter yang sedang dipakai (border primary).
 */
function FilterPill({
  label,
  menuLabel,
  value,
  options,
  onValueChange,
  triggerLabel,
  active: highlighted,
}: {
  /* Nama aksesibel, mis. "Filter anak" */
  label: string
  menuLabel: string
  value: string
  options: { value: string; label: string }[]
  onValueChange: (value: string) => void
  triggerLabel?: string
  active?: boolean
}) {
  const active = options.find((o) => o.value === value) ?? options[0]
  const pill =
    "inline-flex w-fit shrink-0 items-center gap-ns-s rounded-full border border-grayscale-border-default bg-grayscale-surface-default px-ns-m py-ns-s text-subtitle leading-normal font-bold text-grayscale-text-title"

  if (options.length < 2) {
    return <span className={pill}>{active?.label}</span>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}: ${active?.label}. Ganti`}
        className={`${pill} ${highlighted ? "border-primary-border-default bg-primary-surface-subtitle" : ""} outline-none hover:border-grayscale-border-darker focus-visible:ring-2 focus-visible:ring-primary-border-lighter data-popup-open:border-primary-border-default`}
      >
        {triggerLabel ?? active?.label}
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(v) => onValueChange(v as string)}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="min-h-12"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { FilterPill }
