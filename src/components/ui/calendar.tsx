import * as React from "react"
import { format, type Locale } from "date-fns"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"
import { id as localeId } from "react-day-picker/locale"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/styles/cn"

/*
 * Calendar · Figma PINTARA → Components → 03 · Date & Time → panel kalender
 * (Selection=Single / Selection=Range) dan ".Calendar day".
 *
 * - Locale Indonesia, minggu dimulai Senin, 6 baris (42 sel) termasuk
 *   tanggal bulan sekitar.
 * - Sel 36px, jarak 4px, radius 4 (Radius/S).
 * - State sel: default (putih) · outside month (Grayscale/Surface/subtitle) ·
 *   selected (Primary/Surface/default) · in range (Primary/Surface/subtitle).
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = true,
  captionLayout = "label",
  locale = localeId,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()
  /* Locale DayPicker kompatibel dengan date-fns; tipe di-cast untuk format() */
  const dfLocale = locale as Locale

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      className={cn(
        "group/calendar w-full [--cell-gap:--spacing(1)] [--cell-size:--spacing(9)]",
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatWeekdayName: (date) => format(date, "EEE", { locale: dfLocale }),
        formatMonthDropdown: (date) => format(date, "MMM", { locale: dfLocale }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("relative flex flex-col gap-ns-l md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-ns-m", defaultClassNames.month),
        nav: cn(
          "absolute top-0 right-0 flex items-center gap-ns-2xs",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "flex size-6 items-center justify-center rounded-sm text-primary-surface-default outline-none select-none hover:bg-primary-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter aria-disabled:pointer-events-none aria-disabled:text-grayscale-text-disabled",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "flex size-6 items-center justify-center rounded-sm text-primary-surface-default outline-none select-none hover:bg-primary-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter aria-disabled:pointer-events-none aria-disabled:text-grayscale-text-disabled",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-6 w-full items-center justify-start pr-16",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-6 items-center gap-ns-xs text-subtitle font-bold",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn("relative rounded-sm", defaultClassNames.dropdown_root),
        dropdown: cn(
          "absolute inset-0 bg-grayscale-surface-default opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "text-subtitle font-bold text-grayscale-text-title select-none",
          captionLayout !== "label" &&
            "flex items-center gap-1 [&>svg]:size-3.5 [&>svg]:text-grayscale-text-caption",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("mb-ns-m flex gap-(--cell-gap)", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-caption font-normal text-grayscale-text-caption select-none",
          defaultClassNames.weekday
        ),
        weeks: cn("flex flex-col gap-(--cell-gap)", defaultClassNames.weeks),
        week: cn("flex w-full gap-(--cell-gap)", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-caption text-grayscale-text-caption select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative h-(--cell-size) flex-1 p-0 text-center select-none",
          defaultClassNames.day
        ),
        range_start: defaultClassNames.range_start,
        range_middle: defaultClassNames.range_middle,
        range_end: defaultClassNames.range_end,
        today: defaultClassNames.today,
        outside: defaultClassNames.outside,
        disabled: defaultClassNames.disabled,
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon
          return <Icon className={cn("size-4", className)} strokeWidth={2.5} {...props} />
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const selectedEnd =
    modifiers.selected && !modifiers.range_middle
  const inRange = modifiers.range_middle

  return (
    <button
      ref={ref}
      type="button"
      data-slot="calendar-day"
      data-day={format(day.date, "yyyy-MM-dd")}
      data-selected-end={selectedEnd || undefined}
      data-in-range={inRange || undefined}
      data-outside={modifiers.outside || undefined}
      data-today={modifiers.today || undefined}
      className={cn(
        "flex size-full items-center justify-center rounded-sm bg-grayscale-surface-default text-subtitle leading-none font-normal text-grayscale-text-body transition-colors outline-none",
        "hover:bg-primary-surface-subtitle focus-visible:ring-2 focus-visible:ring-primary-border-lighter",
        "data-outside:bg-grayscale-surface-subtitle",
        "data-today:font-bold",
        "data-in-range:bg-primary-surface-subtitle",
        "data-[selected-end]:bg-primary-surface-default data-[selected-end]:text-primary-text-label data-[selected-end]:hover:bg-primary-surface-darker",
        "disabled:pointer-events-none disabled:text-grayscale-text-disabled",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
