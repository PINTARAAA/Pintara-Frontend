import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { ChevronDownIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import {
  TabScreen,
  StatusBadge,
  Button,
  DataState,
  Field,
  FieldLabel,
  ListItem,
  Popover,
  PopoverContent,
  PopoverTitle,
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
} from "@/components"
import {
  DashboardSection,
  ExpandableList,
  NotificationButton,
} from "@/features/dashboard/components"

import { useTutorUnreadNotifications } from "@/features/notifikasi/api"
import { tutorHistoryQuery } from "@/features/presensi/api"
import { getErrorMessage } from "@/lib/api"
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks"
import type { TutorHistory, TutorSession } from "@/types/presensi"
import { firstName, parseMonth, formatShortWeekdayDate } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * T4 · Riwayat Les (tab tutor) · Figma "Riwayat Les / Tutor" dan
 * "Riwayat Les / Tutor - Filter".
 *
 * Pil Periode + Siswa (ketuk → bottom sheet "Filter riwayat": Periode
 * select, Siswa radio, Reset · Terapkan) → kartu ringkasan (sesi
 * terlaksana, jumlah siswa, tidak terlaksana, sesi per siswa) → Riwayat sesi
 * (badge status presensi; ketuk → detail presensi atau isi presensi).
 * Filter disimpan di ?bulan=YYYY-MM&siswa=Nama.
 *
 * Desktop (≥ lg, frame "… (Desktop)"): halaman putih, Page header "Riwayat
 * Les" dengan pil di kanan; "Filter riwayat" tampil sebagai panel 360px di
 * bawah pil (bukan bottom sheet). Riwayat sesi di kolom utama, ringkasan
 * 380px di kanan (jarak 40).
 *
 * Riwayat sesi menampilkan 5 sesi pertama + "Lihat selengkapnya" agar
 * halaman tidak perlu digulir panjang (tambahan di luar Figma).
 */
const monthKey = (d: Date) => format(d, "yyyy-MM")
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const ALL = "semua"

type Filter = { month: string; student: string }

function RiwayatTutor() {
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get("bulan"))
  const student = params.get("siswa")
  const [filterOpen, setFilterOpen] = React.useState(false)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  /* Acuan posisi panel filter desktop: pil di Page header */
  const headerPills = React.useRef<HTMLDivElement>(null)

  const query = useQuery({
    ...tutorHistoryQuery(month, student),
    placeholderData: keepPreviousData,
  })
  const data = query.data
  const unread = useTutorUnreadNotifications()

  const applyFilter = (next: Filter) => {
    const search = new URLSearchParams()
    search.set("bulan", next.month)
    if (next.student !== ALL) search.set("siswa", next.student)
    setParams(search, { replace: true })
  }

  const pills = data && (
    <FilterPills data={data} onOpen={() => setFilterOpen(true)} />
  )

  return (
    <TabScreen
      title="Riwayat"
      desktopTitle="Riwayat Les"
      action={<NotificationButton to="/tutor/notifikasi" unread={unread} />}
      desktopHeader="page"
      desktopHeaderActions={
        <div ref={headerPills} className="flex items-center gap-ns-s">
          {pills}
        </div>
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat riwayat les…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Riwayat gagal dimuat"
          description={getErrorMessage(query.error)}
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
          {/* Desktop: pil pindah ke Page header */}
          <div className="flex flex-wrap gap-ns-s lg:hidden">{pills}</div>

          {data.sessions.length > 0 ? (
            /*
             * Mobile: ringkasan lalu daftar (urutan DOM). Desktop: daftar di
             * kolom kiri, ringkasan 380px di kanan.
             */
            <div className="flex flex-col gap-ns-2xl lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-ns-4xl">
              <SummaryCard
                data={data}
                className="lg:col-start-2 lg:row-start-1"
              />
              <DashboardSection
                title="Riwayat sesi"
                className="lg:col-start-1 lg:row-start-1"
              >
                <ExpandableList
                  /* Filter berubah → daftar kembali ringkas */
                  key={`${monthKey(data.month)}-${data.student ?? ALL}`}
                  items={data.sessions}
                  renderItem={(s) => <HistoryItem key={s.id} session={s} />}
                />
              </DashboardSection>
            </div>
          ) : (
            <DataState
              state="empty"
              title="Belum ada sesi"
              description={`Belum ada sesi les ${data.student ? `bersama ${data.student} ` : ""}di ${monthLabel(data.month)}.`}
            />
          )}

          {isDesktop ? (
            <FilterPopover
              open={filterOpen}
              onOpenChange={setFilterOpen}
              anchor={headerPills}
              data={data}
              onApply={applyFilter}
            />
          ) : (
            <FilterSheet
              open={filterOpen}
              onOpenChange={setFilterOpen}
              data={data}
              onApply={applyFilter}
            />
          )}
        </div>
      ) : null}
    </TabScreen>
  )
}

const pill =
  "inline-flex w-fit items-center gap-ns-s rounded-full border border-grayscale-border-default bg-grayscale-surface-default px-ns-m py-ns-s text-subtitle leading-normal font-bold text-grayscale-text-title outline-none hover:border-grayscale-border-darker focus-visible:ring-2 focus-visible:ring-primary-border-lighter"

function FilterPills({
  data,
  onOpen,
}: {
  data: TutorHistory
  onOpen: () => void
}) {
  return (
    <>
      <button
        type="button"
        className={pill}
        aria-label={`Periode: ${monthLabel(data.month)}. Ubah filter`}
        onClick={onOpen}
      >
        {monthLabel(data.month)}
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        className={pill}
        aria-label={`Siswa: ${data.student ?? "Semua siswa"}. Ubah filter`}
        onClick={onOpen}
      >
        {data.student ?? "Semua siswa"}
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </button>
    </>
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

function SummaryCard({
  data,
  className,
}: {
  data: TutorHistory
  className?: string
}) {
  const { held, cancelled, studentCount, byStudent } = data.summary
  const notes = [
    !data.student && `${studentCount} siswa`,
    cancelled > 0 && `${cancelled} sesi tidak terlaksana`,
  ].filter(Boolean)

  return (
    <section
      aria-label="Ringkasan riwayat"
      className={cn(
        "flex flex-col gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l leading-normal",
        className
      )}
    >
      <div className="flex flex-col gap-ns-2xs">
        <p className="text-body font-bold text-grayscale-text-title">
          {held} sesi terlaksana di{" "}
          {format(data.month, "MMMM", { locale: localeId })}
        </p>
        {notes.length > 0 && (
          <p className="text-caption text-grayscale-text-caption">
            {notes.join(" · ")}
          </p>
        )}
      </div>
      {byStudent.length > 0 && (
        <>
          <div
            aria-hidden="true"
            className="h-px bg-grayscale-border-disabled"
          />
          <dl className="flex flex-col gap-ns-m text-subtitle">
            {byStudent.map(({ name, count }) => (
              <div
                key={name}
                className="flex items-start justify-between gap-ns-m"
              >
                <dt className="text-grayscale-text-body">{name}</dt>
                <dd className="font-bold text-grayscale-text-title">
                  {count} sesi
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}

/*
 * Draf filter: setiap panel dibuka, mulai dari filter yang sedang berlaku;
 * pilihan baru berlaku setelah "Terapkan".
 */
function useFilterDraft(
  data: TutorHistory,
  onOpenChange: (open: boolean) => void
) {
  const current = { month: monthKey(data.month), student: data.student ?? ALL }
  const [draft, setDraft] = React.useState<Filter>(current)
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(current)
    onOpenChange(next)
  }
  return { draft, setDraft, handleOpenChange }
}

type FilterPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: TutorHistory
  onApply: (filter: Filter) => void
}

/*
 * Bottom sheet "Filter riwayat" (mobile): handle 40×4, judul Headline/Bold,
 * isian, aksi Reset (Secondary) · Terapkan (Primary).
 */
function FilterSheet({ open, onOpenChange, data, onApply }: FilterPanelProps) {
  const { draft, setDraft, handleOpenChange } = useFilterDraft(
    data,
    onOpenChange
  )

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
        <FilterFields
          data={data}
          draft={draft}
          setDraft={setDraft}
          onApply={() => {
            onApply(draft)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

/* Panel "Filter riwayat" (desktop): 360px, rata kanan di bawah pil */
function FilterPopover({
  open,
  onOpenChange,
  anchor,
  data,
  onApply,
}: FilterPanelProps & { anchor: React.RefObject<HTMLElement | null> }) {
  const { draft, setDraft, handleOpenChange } = useFilterDraft(
    data,
    onOpenChange
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverContent
        anchor={anchor}
        align="end"
        sideOffset={12}
        className="w-90 gap-ns-l p-ns-l"
      >
        <PopoverTitle className="text-headline leading-normal">
          Filter riwayat
        </PopoverTitle>
        <FilterFields
          data={data}
          draft={draft}
          setDraft={setDraft}
          onApply={() => {
            onApply(draft)
            onOpenChange(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/* Isian filter bersama: Periode (Select), Siswa (Radio), Reset · Terapkan */
function FilterFields({
  data,
  draft,
  setDraft,
  onApply,
}: {
  data: TutorHistory
  draft: Filter
  setDraft: React.Dispatch<React.SetStateAction<Filter>>
  onApply: () => void
}) {
  return (
    <>
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
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, student: v as string }))
          }
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
            setDraft({
              month: monthKey(data.months[0] ?? data.month),
              student: ALL,
            })
          }
        >
          Reset
        </Button>
        <Button onClick={onApply}>Terapkan</Button>
      </div>
    </>
  )
}

export { RiwayatTutor }
