import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { ChevronDownIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { TabScreen } from "@/components/layouts/tab-screen"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/ui/data-state"
import { Field, FieldLabel } from "@/components/ui/field"
import { ListItem } from "@/components/ui/list-item"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { NotificationButton } from "@/features/dashboard/components/notification-button"
import { useTutorUnreadNotifications } from "@/features/notifikasi/api/notifikasi-tutor"
import {
  tutorHistoryQuery,
  type TutorHistory,
  type TutorSession,
} from "@/features/presensi/api/presensi"
import { firstName } from "@/features/presensi/lib/format"
import { formatShortWeekdayDate } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * T4 · Riwayat Les (tab tutor) · Figma "Riwayat Les / Tutor" dan
 * "Riwayat Les / Tutor - Filter".
 *
 * Pil Periode + Siswa (ketuk → bottom sheet "Filter riwayat": Periode
 * select, Siswa radio, Reset · Terapkan) → kartu ringkasan (sesi
 * terlaksana, jumlah siswa, tidak terlaksana, sesi per siswa) → Riwayat sesi
 * (badge status presensi; ketuk → detail presensi atau isi presensi).
 * Filter disimpan di ?bulan=YYYY-MM&siswa=Nama.
 */
const monthKey = (d: Date) => format(d, "yyyy-MM")
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const ALL = "semua"

function parseMonth(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return undefined
  const [y, m] = value.split("-").map(Number)
  return new Date(y, m - 1, 1)
}

function RiwayatTutor() {
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get("bulan"))
  const student = params.get("siswa")
  const [filterOpen, setFilterOpen] = React.useState(false)

  const query = useQuery({
    ...tutorHistoryQuery(month, student),
    placeholderData: keepPreviousData,
  })
  const data = query.data
  const unread = useTutorUnreadNotifications()

  const applyFilter = (next: { month: string; student: string }) => {
    const search = new URLSearchParams()
    search.set("bulan", next.month)
    if (next.student !== ALL) search.set("siswa", next.student)
    setParams(search, { replace: true })
  }

  const pill =
    "inline-flex w-fit items-center gap-ns-s rounded-full border border-grayscale-border-default bg-grayscale-surface-default px-ns-m py-ns-s text-subtitle leading-normal font-bold text-grayscale-text-title outline-none hover:border-grayscale-border-darker focus-visible:ring-2 focus-visible:ring-primary-border-lighter"

  return (
    <TabScreen
      title="Riwayat"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat riwayat les…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Riwayat gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data ? (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn(
            "flex flex-col gap-ns-2xl transition-opacity",
            query.isPlaceholderData && "opacity-60"
          )}
        >
          <div className="flex flex-wrap gap-ns-s">
            <button
              type="button"
              className={pill}
              aria-label={`Periode: ${monthLabel(data.month)}. Ubah filter`}
              onClick={() => setFilterOpen(true)}
            >
              {monthLabel(data.month)}
              <ChevronDownIcon aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              className={pill}
              aria-label={`Siswa: ${data.student ?? "Semua siswa"}. Ubah filter`}
              onClick={() => setFilterOpen(true)}
            >
              {data.student ?? "Semua siswa"}
              <ChevronDownIcon aria-hidden="true" className="size-4" />
            </button>
          </div>

          {data.sessions.length > 0 ? (
            <div className="grid gap-ns-2xl lg:grid-cols-2 lg:items-start">
              <SummaryCard data={data} />
              <DashboardSection title="Riwayat sesi">
                <DashboardList>
                  {data.sessions.map((s) => (
                    <HistoryItem key={s.id} session={s} />
                  ))}
                </DashboardList>
              </DashboardSection>
            </div>
          ) : (
            <DataState
              state="empty"
              title="Belum ada sesi"
              description={`Belum ada sesi les ${data.student ? `bersama ${data.student} ` : ""}di ${monthLabel(data.month)}.`}
            />
          )}

          <FilterSheet
            open={filterOpen}
            onOpenChange={setFilterOpen}
            data={data}
            onApply={applyFilter}
          />
        </div>
      ) : null}
    </TabScreen>
  )
}

function HistoryItem({ session }: { session: TutorSession }) {
  const record = session.record
  const description = !record
    ? "belum diisi"
    : !record.held
      ? "tidak terlaksana"
      : (record.topic ?? "")

  return (
    <ListItem
      title={`${firstName(session.student.name)} · ${session.subject}`}
      description={`${formatShortWeekdayDate(session.start)} · ${description}`}
      badge={
        <StatusBadge
          category="presensi"
          status={record ? record.validation : "belum_dikumpulkan"}
        />
      }
      render={
        <Link
          to={
            record
              ? `/tutor/presensi/status/${session.id}`
              : `/tutor/presensi/${session.id}`
          }
        />
      }
    />
  )
}

function SummaryCard({ data }: { data: TutorHistory }) {
  const { held, cancelled, studentCount, byStudent } = data.summary
  const notes = [
    !data.student && `${studentCount} siswa`,
    cancelled > 0 && `${cancelled} sesi tidak terlaksana`,
  ].filter(Boolean)

  return (
    <section
      aria-label="Ringkasan riwayat"
      className="flex flex-col gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l leading-normal"
    >
      <div className="flex flex-col gap-ns-2xs">
        <p className="text-body font-bold text-grayscale-text-title">
          {held} sesi terlaksana di {format(data.month, "MMMM", { locale: localeId })}
        </p>
        {notes.length > 0 && (
          <p className="text-caption text-grayscale-text-caption">
            {notes.join(" · ")}
          </p>
        )}
      </div>
      {byStudent.length > 0 && (
        <>
          <div aria-hidden="true" className="h-px bg-grayscale-border-disabled" />
          <dl className="flex flex-col gap-ns-m text-subtitle">
            {byStudent.map(({ name, count }) => (
              <div key={name} className="flex items-start justify-between gap-ns-m">
                <dt className="text-grayscale-text-body">{name}</dt>
                <dd className="font-bold text-grayscale-text-title">{count} sesi</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}

/*
 * Bottom sheet "Filter riwayat": handle 40×4, judul Headline/Bold, Periode
 * (Select) dan Siswa (Radio), aksi Reset (Secondary) · Terapkan (Primary).
 * Pilihan baru berlaku setelah "Terapkan".
 */
function FilterSheet({
  open,
  onOpenChange,
  data,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: TutorHistory
  onApply: (filter: { month: string; student: string }) => void
}) {
  const current = { month: monthKey(data.month), student: data.student ?? ALL }
  const [draft, setDraft] = React.useState(current)

  /* Setiap sheet dibuka, mulai dari filter yang sedang berlaku */
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(current)
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-ns-l rounded-t-2xl px-ns-l pt-ns-m pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-md"
      >
        <span
          aria-hidden="true"
          className="mx-auto h-1 w-10 shrink-0 rounded-full bg-grayscale-border-disabled"
        />
        <SheetTitle className="text-headline">Filter riwayat</SheetTitle>

        <Field>
          <FieldLabel htmlFor="filter-month">Periode</FieldLabel>
          <Select
            /* Label untuk nilai terpilih, mis. "2026-11" → "November 2026" */
            items={data.months.map((m) => ({
              value: monthKey(m),
              label: monthLabel(m),
            }))}
            value={draft.month}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, month: (v as string | null) ?? d.month }))
            }
          >
            <SelectTrigger id="filter-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {data.months.map((m) => (
                  <SelectItem key={monthKey(m)} value={monthKey(m)}>
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <fieldset className="flex flex-col gap-ns-m">
          <legend className="mb-ns-m text-subtitle leading-normal font-bold text-grayscale-text-title">
            Siswa
          </legend>
          <RadioGroup
            value={draft.student}
            onValueChange={(v) => setDraft((d) => ({ ...d, student: v as string }))}
            className="gap-ns-m"
          >
            <RadioGroupItem value={ALL} label="Semua siswa" />
            {data.students.map((name) => (
              <RadioGroupItem key={name} value={name} label={name} />
            ))}
          </RadioGroup>
        </fieldset>

        <div className="flex gap-ns-m pt-ns-s *:flex-1">
          <Button
            variant="secondary"
            onClick={() =>
              setDraft({ month: monthKey(data.months[0] ?? data.month), student: ALL })
            }
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply(draft)
              onOpenChange(false)
            }}
          >
            Terapkan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { RiwayatTutor }
