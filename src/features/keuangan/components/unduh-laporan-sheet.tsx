import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useSearchParams } from "react-router"

import {
  Button,
  Field,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetTitle,
  toast,
} from "@/components"
import { monthKey, generateReport, REPORT_TYPES } from "@/features/keuangan/api"
import type {
  ReportFile,
  ReportFormat,
  ReportInput,
  ReportType,
} from "@/types/keuangan"
import { cn } from "@/lib/styles"

/*
 * P8 · Unduh laporan · Figma "Laporan Keuangan / Unduh laporan",
 * "Berhasil diunduh" dan "Gagal dibuat".
 *
 * Bottom sheet: Periode (Select) → Jenis laporan (Radio) → Format
 * (PDF / Excel) → Batal · Unduh. Hasilnya tampil sebagai toast: berhasil
 * (nama & ukuran file, aksi Buka) atau gagal (aksi Coba lagi).
 * Tambahkan ?unduh=gagal pada URL untuk menguji toast gagal.
 *
 * Desktop (≥ lg): bukan bottom sheet, melainkan dialog 480px di tengah
 * layar (tanpa handle), format PDF/Excel dua kolom.
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const fileSize = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`

function openReport(file: ReportFile) {
  const link = document.createElement("a")
  link.href = file.url
  link.download = file.name
  link.click()
}

function useReportDownload() {
  const [params] = useSearchParams()
  const simulateFailure = params.get("unduh") === "gagal"

  const mutation = useMutation({
    mutationFn: (input: ReportInput) =>
      generateReport(input, { simulateFailure }),
    networkMode: "always",
    onSuccess: (file) =>
      toast.success("Laporan siap diunduh", {
        description: `${file.name} (${fileSize(file.size)})`,
        action: { label: "Buka", onClick: () => openReport(file) },
        duration: 8000,
      }),
    onError: (_, input) =>
      toast.error("Laporan gagal dibuat", {
        description: "Terjadi kendala saat menyusun file. Data Anda aman.",
        action: { label: "Coba lagi", onClick: () => mutation.mutate(input) },
        duration: 8000,
      }),
  })
  return mutation
}

function UnduhLaporanSheet({
  open,
  onOpenChange,
  months,
  month,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /* Periode yang bisa dipilih */
  months: Date[]
  /* Periode awal (yang sedang dilihat) */
  month: Date
}) {
  const download = useReportDownload()
  const initial = {
    month: monthKey(month),
    type: "lengkap" as ReportType,
    format: "pdf" as ReportFormat,
  }
  const [draft, setDraft] = React.useState(initial)

  /* Setiap sheet dibuka, mulai dari periode yang sedang dilihat */
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(initial)
    onOpenChange(next)
  }

  const submit = () => {
    const picked = months.find((m) => monthKey(m) === draft.month) ?? month
    download.mutate({ month: picked, type: draft.type, format: draft.format })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "gap-ns-l px-ns-l pt-ns-m sm:max-w-md rounded-t-2xl pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))] sm:mx-auto",
          /* Desktop (Figma "Unduh laporan (Desktop)"): dialog di tengah, 480px */
          "lg:p-ns-2xl lg:mx-0 lg:w-120 lg:max-w-[calc(100%-2rem)] lg:rounded-2xl lg:border",
          /* Varian data-side agar mengalahkan posisi bawaan sheet bawah */
          "lg:data-[side=bottom]:top-1/2 lg:data-[side=bottom]:right-auto lg:data-[side=bottom]:bottom-auto lg:data-[side=bottom]:left-1/2 lg:data-[side=bottom]:-translate-x-1/2 lg:data-[side=bottom]:-translate-y-1/2"
        )}
      >
        <span
          aria-hidden="true"
          className="bg-grayscale-border-disabled mx-auto h-1 w-10 shrink-0 rounded-full lg:hidden"
        />
        <SheetTitle className="text-headline">
          Unduh laporan keuangan
        </SheetTitle>

        <Field>
          <FieldLabel htmlFor="report-month">Periode</FieldLabel>
          <Select
            items={months.map((m) => ({
              value: monthKey(m),
              label: monthLabel(m),
            }))}
            value={draft.month}
            onValueChange={(v) =>
              setDraft((d) => ({
                ...d,
                month: (v as string | null) ?? d.month,
              }))
            }
          >
            <SelectTrigger id="report-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {months.map((m) => (
                  <SelectItem key={monthKey(m)} value={monthKey(m)}>
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <fieldset className="gap-ns-m flex flex-col">
          <legend className="mb-ns-m text-subtitle text-grayscale-text-title leading-normal font-bold">
            Jenis laporan
          </legend>
          <RadioGroup
            value={draft.type}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, type: v as ReportType }))
            }
            className="gap-0 *:min-h-12"
          >
            {(Object.keys(REPORT_TYPES) as ReportType[]).map((type) => (
              <RadioGroupItem
                key={type}
                value={type}
                label={REPORT_TYPES[type]}
              />
            ))}
          </RadioGroup>
        </fieldset>

        <fieldset className="gap-ns-m flex flex-col">
          <legend className="mb-ns-m text-subtitle text-grayscale-text-title leading-normal font-bold">
            Format
          </legend>
          <RadioGroup
            value={draft.format}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, format: v as ReportFormat }))
            }
            /* Desktop: dua kolom sama lebar seperti Figma */
            className="gap-x-ns-2xl flex flex-row *:min-h-12 lg:grid lg:grid-cols-2"
          >
            <RadioGroupItem value="pdf" label="PDF" />
            <RadioGroupItem value="xlsx" label="Excel (.xlsx)" />
          </RadioGroup>
        </fieldset>

        <div className="gap-ns-m pt-ns-s flex *:flex-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Unduh</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { UnduhLaporanSheet }
