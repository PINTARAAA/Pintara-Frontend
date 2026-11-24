"use client"

import * as React from "react"
import { startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useControllableState } from "@/hooks/state/use-controllable-state"
import { fieldControlVariants, fieldHeight } from "@/lib/styles/field-variants"
import { formatDate, formatDateLong, formatDateRange } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * Date picker & Date range · Figma PINTARA → Components → 03 · Date & Time
 *
 * Satu ukuran (Medium, field 48px). State: default · filled · error
 * (aria-invalid) · disabled · open. Panel: kalender + ringkasan pilihan +
 * aksi "Hari ini" (tertiary) dan "Terapkan" (primary). Pilihan baru disimpan
 * setelah "Terapkan" ditekan.
 *
 * <Field>
 *   <FieldLabel htmlFor="tgl">Tanggal</FieldLabel>
 *   <DatePicker id="tgl" value={date} onValueChange={setDate} />
 *   <FieldDescription>Gunakan format tanggal yang sesuai.</FieldDescription>
 * </Field>
 */

type PickerTriggerProps = Omit<
  React.ComponentProps<typeof PopoverTrigger>,
  "children"
> & {
  invalid?: boolean
  children: React.ReactNode
}

/* Field 48px bergaya Input + ikon kalender 24px */
function PickerTrigger({
  className,
  invalid,
  children,
  ...props
}: PickerTriggerProps) {
  return (
    <PopoverTrigger
      data-slot="date-picker-trigger"
      aria-invalid={invalid || undefined}
      className={cn(
        fieldControlVariants({ size: "default" }),
        fieldHeight.default,
        "group/picker flex items-center justify-between gap-(--comp-gap-md) text-left data-popup-open:border-primary-border-default data-popup-open:ring-1 data-popup-open:ring-primary-border-default data-popup-open:ring-inset",
        className
      )}
      {...props}
    >
      {children}
      <CalendarIcon
        aria-hidden="true"
        className="size-(--comp-icon-md) shrink-0 text-grayscale-text-body"
      />
    </PopoverTrigger>
  )
}

/* Ringkasan + tombol aksi di bawah kalender */
function PickerFooter({
  summary,
  onToday,
  onApply,
  canApply,
}: {
  summary: React.ReactNode
  onToday: () => void
  onApply: () => void
  canApply: boolean
}) {
  return (
    <>
      <p
        aria-live="polite"
        className={cn(
          "text-subtitle leading-normal",
          summary ? "text-primary-text-primary" : "text-grayscale-text-caption"
        )}
      >
        {summary ?? "Belum ada tanggal dipilih"}
      </p>
      <div className="flex items-center justify-between">
        <Button variant="tertiary" onClick={onToday}>
          Hari ini
        </Button>
        <Button onClick={onApply} disabled={!canApply}>
          Terapkan
        </Button>
      </div>
    </>
  )
}

type CalendarPassThrough = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect" | "month" | "onMonthChange" | "required"
>

function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pilih tanggal",
  disabled,
  invalid,
  id,
  className,
  calendarProps,
}: {
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
  calendarProps?: CalendarPassThrough
}) {
  const [date, setDate] = useControllableState<Date | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  })
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Date | undefined>()
  const [month, setMonth] = React.useState<Date>(new Date())

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(date ?? undefined)
      setMonth(date ?? new Date())
    }
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PickerTrigger
        id={id}
        disabled={disabled}
        invalid={invalid}
        className={className}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !date && "text-grayscale-text-subtitle"
          )}
        >
          {date ? formatDate(date) : placeholder}
        </span>
      </PickerTrigger>
      <PopoverContent align="start" className="w-80">
        <Calendar
          {...calendarProps}
          mode="single"
          selected={draft}
          onSelect={setDraft}
          month={month}
          onMonthChange={setMonth}
        />
        <PickerFooter
          summary={draft ? formatDateLong(draft) : null}
          canApply={!!draft}
          onToday={() => {
            const today = startOfDay(new Date())
            setDraft(today)
            setMonth(today)
          }}
          onApply={() => {
            setDate(draft ?? null)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  startPlaceholder = "Tanggal mulai",
  endPlaceholder = "Tanggal selesai",
  disabled,
  invalid,
  id,
  className,
  calendarProps,
}: {
  value?: DateRange | null
  defaultValue?: DateRange | null
  onValueChange?: (range: DateRange | null) => void
  startPlaceholder?: string
  endPlaceholder?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
  calendarProps?: CalendarPassThrough
}) {
  const [range, setRange] = useControllableState<DateRange | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  })
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange | undefined>()
  const [month, setMonth] = React.useState<Date>(new Date())

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(range ?? undefined)
      setMonth(range?.from ?? new Date())
    }
    setOpen(next)
  }

  const filled = !!(range?.from && range.to)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PickerTrigger
        id={id}
        disabled={disabled}
        invalid={invalid}
        className={className}
      >
        {filled ? (
          <span className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-(--comp-gap-lg)">
            <span className="truncate">{formatDate(range!.from!)}</span>
            <span aria-hidden="true">–</span>
            <span className="truncate">{formatDate(range!.to!)}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-grayscale-text-subtitle">
            {startPlaceholder} – {endPlaceholder}
          </span>
        )}
      </PickerTrigger>
      <PopoverContent align="start" className="w-80">
        <Calendar
          {...calendarProps}
          mode="range"
          selected={draft}
          onSelect={setDraft}
          month={month}
          onMonthChange={setMonth}
        />
        <PickerFooter
          summary={draft?.from ? formatDateRange(draft.from, draft.to) : null}
          canApply={!!(draft?.from && draft.to)}
          onToday={() => {
            const today = startOfDay(new Date())
            setDraft({ from: today, to: undefined })
            setMonth(today)
          }}
          onApply={() => {
            setRange(draft ?? null)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
