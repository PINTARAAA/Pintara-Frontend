import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { UserIcon } from "lucide-react"
import { useSearchParams } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  Button,
  DataState,
  FilterChip,
  FilterPill,
  ListItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import { parseMonth } from "@/features/keuangan/lib"
import { firstName } from "@/features/presensi/lib"
import {
  lessonRecapQuery,
  type LessonRecap,
  type RecapSession,
} from "@/features/rekap-les/api"
import { formatShortWeekdayDate } from "@/lib/format/date"
import { cn } from "@/lib/styles/cn"

/*
 * P11 · Rekap & Riwayat Les · Figma "Riwayat Les / Pengelola - Per tutor",
 * "- Riwayat" dan "- Tidak ditemukan".
 *
 * Pil Periode · Tutor · Siswa (filter aktif tampil sebagai chip dengan ×)
 * → tab Per tutor · Per siswa · Riwayat. Per tutor/siswa: ringkasan + daftar
 * urut sesi terbanyak (ketuk → filter + tab Riwayat). Riwayat: ringkasan
 * filter + daftar sesi dengan status presensi.
 * Disimpan di ?tab=…&bulan=YYYY-MM&tutor=…&siswa=….
 */
type Tab = "tutor" | "siswa" | "riwayat"
const TABS: { value: Tab; label: string }[] = [
  { value: "tutor", label: "Per tutor" },
  { value: "siswa", label: "Per siswa" },
  { value: "riwayat", label: "Riwayat" },
]
const PREVIEW = 5
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const monthKey = (d: Date) => format(d, "yyyy-MM")
const shortTutor = (name: string) => name.split(" ").slice(0, 2).join(" ")

function RekapLes() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.value === params.get("tab"))?.value ?? "tutor"
  const filter = {
    month: parseMonth(params.get("bulan")),
    tutorId: params.get("tutor") ?? undefined,
    studentId: params.get("siswa") ?? undefined,
  }
  const query = useQuery({
    ...lessonRecapQuery(filter),
    placeholderData: keepPreviousData,
  })
  const data = query.data

  const update = (next: Partial<Record<"tab" | "bulan" | "tutor" | "siswa", string | null>>) => {
    const search = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value)
      else search.delete(key)
    }
    if (search.get("tab") === "tutor") search.delete("tab")
    setParams(search, { replace: true })
  }
  const reset = () => update({ bulan: null, tutor: null, siswa: null })

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => update({ tab: v as string })}
      className="contents"
    >
      <DetailScreen
        title="Rekap & Riwayat Les"
        subheader={
          <div className="gap-ns-s flex flex-col">
            <div className="gap-ns-s -mx-(--gutter) px-(--gutter) flex overflow-x-auto [scrollbar-width:none]">
              {data ? (
                <Filters data={data} filter={filter} onChange={update} />
              ) : (
                <span className="h-9" />
              )}
            </div>
            <TabsList className="border-grayscale-border-default -mb-ns-m w-full border-b *:-mb-px">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        }
      >
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="flex flex-col">
            {query.isPending ? (
              <DataState state="loading" loadingLabel="Memuat rekap les…" />
            ) : query.isError || !data ? (
              <DataState
                state="error"
                title="Rekap les gagal dimuat"
                description="Periksa koneksi Anda, lalu coba lagi."
                action={{ label: "Coba lagi", onClick: () => query.refetch() }}
              />
            ) : data.sessions.length === 0 ? (
              <NotFound data={data} filter={filter} onReset={reset} />
            ) : (
              <div
                aria-busy={query.isPlaceholderData}
                className={cn(
                  "gap-ns-l flex flex-col transition-opacity lg:max-w-3xl",
                  query.isPlaceholderData && "opacity-60"
                )}
              >
                {t.value === "tutor" && (
                  <PerTutor
                    data={data}
                    onPick={(id) => update({ tutor: id, tab: "riwayat" })}
                  />
                )}
                {t.value === "siswa" && (
                  <PerStudent
                    data={data}
                    onPick={(id) => update({ siswa: id, tab: "riwayat" })}
                  />
                )}
                {t.value === "riwayat" && <History data={data} filter={filter} />}
              </div>
            )}
          </TabsContent>
        ))}
      </DetailScreen>
    </Tabs>
  )
}

type Filter = { month?: Date; tutorId?: string; studentId?: string }

function Filters({
  data,
  filter,
  onChange,
}: {
  data: LessonRecap
  filter: Filter
  onChange: (next: Partial<Record<"bulan" | "tutor" | "siswa", string | null>>) => void
}) {
  const tutor = data.tutorOptions.find((t) => t.id === filter.tutorId)
  const student = data.studentOptions.find((s) => s.id === filter.studentId)
  const current = monthKey(data.months[0])

  return (
    <>
      <FilterPill
        label="Periode"
        menuLabel="Pilih periode"
        value={monthKey(data.month)}
        options={data.months.map((m) => ({ value: monthKey(m), label: monthLabel(m) }))}
        onValueChange={(v) => onChange({ bulan: v === current ? null : v })}
      />
      {filter.tutorId ? (
        <FilterChip
          label={tutor?.name ?? "Tutor"}
          onClear={() => onChange({ tutor: null })}
        />
      ) : (
        <FilterPill
          label="Tutor"
          menuLabel="Pilih tutor"
          triggerLabel="Semua tutor"
          value=""
          options={[
            { value: "", label: "Semua tutor" },
            ...data.tutorOptions.map((t) => ({ value: t.id, label: t.name })),
          ]}
          onValueChange={(v) => onChange({ tutor: v || null })}
        />
      )}
      {filter.studentId ? (
        <FilterChip
          label={student?.name ?? "Siswa"}
          onClear={() => onChange({ siswa: null })}
        />
      ) : (
        <FilterPill
          label="Siswa"
          menuLabel="Pilih siswa"
          triggerLabel="Semua siswa"
          value=""
          options={[
            { value: "", label: "Semua siswa" },
            ...data.studentOptions.map((s) => ({ value: s.id, label: s.name })),
          ]}
          onValueChange={(v) => onChange({ siswa: v || null })}
        />
      )}
    </>
  )
}

function SummaryCard({ title, caption }: { title: string; caption: string }) {
  return (
    <section
      aria-label="Ringkasan"
      className="gap-ns-2xs border-grayscale-border-default bg-grayscale-surface-default p-ns-l flex flex-col rounded-(--comp-radius-md) border leading-normal"
    >
      <p className="text-body text-grayscale-text-title font-bold">{title}</p>
      <p className="text-caption text-grayscale-text-caption">{caption}</p>
    </section>
  )
}

function useExpandable<T>(items: T[]) {
  const [expanded, setExpanded] = React.useState(false)
  return {
    visible: expanded ? items : items.slice(0, PREVIEW),
    hidden: items.length - PREVIEW,
    expanded,
    toggle: () => setExpanded((v) => !v),
  }
}

function PerTutor({ data, onPick }: { data: LessonRecap; onPick: (id: string) => void }) {
  const list = useExpandable(data.byTutor)
  return (
    <>
      <SummaryCard
        title={`${data.held} sesi terlaksana`}
        caption={`${data.missed} tidak terlaksana · ${data.byTutor.length} tutor · ${data.pairs} pasangan aktif`}
      />
      <p className="text-caption text-grayscale-text-caption leading-normal">
        Diurutkan dari jumlah sesi terbanyak
      </p>
      <DashboardList>
        {list.visible.map((t) => (
          <ListItem
            key={t.id}
            icon={<UserIcon />}
            title={t.name}
            description={`${t.students} siswa · ${t.missed} tidak terlaksana`}
            trailingText={`${t.sessions} sesi`}
            chevron
            render={<button type="button" onClick={() => onPick(t.id)} />}
          />
        ))}
      </DashboardList>
      {list.hidden > 0 && (
        <Button variant="tertiary" size="sm" className="w-fit" aria-expanded={list.expanded} onClick={list.toggle}>
          {list.expanded ? "Ringkas" : `Lihat ${list.hidden} tutor lainnya`}
        </Button>
      )}
    </>
  )
}

function PerStudent({ data, onPick }: { data: LessonRecap; onPick: (id: string) => void }) {
  const list = useExpandable(data.byStudent)
  return (
    <>
      <SummaryCard
        title={`${data.held} sesi terlaksana`}
        caption={`${data.missed} tidak terlaksana · ${data.byStudent.length} siswa · ${data.pairs} pasangan aktif`}
      />
      <p className="text-caption text-grayscale-text-caption leading-normal">
        Diurutkan dari jumlah sesi terbanyak
      </p>
      <DashboardList>
        {list.visible.map((s) => (
          <ListItem
            key={s.id}
            icon={<UserIcon />}
            title={s.name}
            description={`${s.tutors.map(shortTutor).join(", ")} · ${s.missed} tidak terlaksana`}
            trailingText={`${s.sessions} sesi`}
            chevron
            render={<button type="button" onClick={() => onPick(s.id)} />}
          />
        ))}
      </DashboardList>
      {list.hidden > 0 && (
        <Button variant="tertiary" size="sm" className="w-fit" aria-expanded={list.expanded} onClick={list.toggle}>
          {list.expanded ? "Ringkas" : `Lihat ${list.hidden} siswa lainnya`}
        </Button>
      )}
    </>
  )
}

/*
 * Rincian jumlah sesi, mis. "Aisyah 5 · Rizky 6 · 1 tidak terlaksana";
 * lebih dari 3 → "… · +N siswa lain"
 */
function breakdown(
  items: { name: string; sessions: number }[],
  missed: number,
  unit: string
) {
  const shown = items.slice(0, 3)
  return [
    ...shown.map((i) => `${i.name} ${i.sessions}`),
    ...(items.length > shown.length
      ? [`+${items.length - shown.length} ${unit} lain`]
      : []),
    ...(missed > 0 ? [`${missed} tidak terlaksana`] : []),
  ].join(" · ")
}

function History({ data, filter }: { data: LessonRecap; filter: Filter }) {
  const list = useExpandable(data.sessions)
  const tutor = data.byTutor.find((t) => t.id === filter.tutorId)
  const student = data.byStudent.find((s) => s.id === filter.studentId)

  const summary =
    tutor && !student
      ? {
          title: `${tutor.name} · ${tutor.sessions} sesi`,
          caption: breakdown(
            data.byStudent.map((s) => ({ name: firstName(s.name), sessions: s.sessions })),
            data.missed,
            "siswa"
          ),
        }
      : student && !tutor
        ? {
            title: `${student.name} · ${student.sessions} sesi`,
            caption: breakdown(
              data.byTutor.map((t) => ({ name: shortTutor(t.name), sessions: t.sessions })),
              data.missed,
              "tutor"
            ),
          }
        : tutor && student
          ? {
              title: `${shortTutor(tutor.name)} · ${firstName(student.name)} · ${data.held} sesi`,
              caption: `${data.missed} tidak terlaksana · ${monthLabel(data.month)}`,
            }
          : {
              title: `${data.held} sesi terlaksana`,
              caption: `${data.missed} tidak terlaksana · ${monthLabel(data.month)}`,
            }

  return (
    <>
      <SummaryCard title={summary.title} caption={summary.caption} />
      <DashboardList>
        {list.visible.map((s) => (
          <SessionRow key={s.id} session={s} showTutor={!filter.tutorId} />
        ))}
      </DashboardList>
      {list.hidden > 0 && (
        <Button variant="tertiary" size="sm" className="w-fit" aria-expanded={list.expanded} onClick={list.toggle}>
          {list.expanded ? "Ringkas" : `Lihat ${list.hidden} sesi lainnya`}
        </Button>
      )}
    </>
  )
}

function SessionRow({ session: s, showTutor }: { session: RecapSession; showTutor: boolean }) {
  const detail =
    s.status === "tidak_terlaksana"
      ? "Tidak terlaksana"
      : s.status === "belum_dikumpulkan"
        ? "presensi belum diisi"
        : (s.topic ?? "")
  return (
    <ListItem
      title={`${firstName(s.studentName)} · ${s.subject}`}
      description={[
        formatShortWeekdayDate(s.date),
        ...(showTutor ? [shortTutor(s.tutorName)] : []),
        detail,
      ].join(" · ")}
      badge={
        s.status === "tidak_terlaksana" ? undefined : (
          <StatusBadge category="presensi" status={s.status} />
        )
      }
    />
  )
}

function NotFound({
  data,
  filter,
  onReset,
}: {
  data: LessonRecap
  filter: Filter
  onReset: () => void
}) {
  const tutor = data.tutorOptions.find((t) => t.id === filter.tutorId)
  const student = data.studentOptions.find((s) => s.id === filter.studentId)
  const period = monthLabel(data.month)
  const description =
    tutor && student
      ? `${shortTutor(tutor.name)} belum mengajar ${firstName(student.name)} di ${period}.`
      : tutor
        ? `${shortTutor(tutor.name)} belum punya sesi di ${period}.`
        : student
          ? `${firstName(student.name)} belum punya sesi di ${period}.`
          : `Belum ada sesi les di ${period}.`
  const filtered = !!(filter.tutorId || filter.studentId || filter.month)

  return (
    <div className="gap-ns-l flex flex-col items-center">
      <DataState
        state="empty"
        className="w-full"
        title={filtered ? "Tidak ada riwayat untuk filter ini" : "Belum ada riwayat les"}
        description={
          filtered
            ? `${description} Coba ubah periode atau hapus salah satu filter.`
            : description
        }
      />
      {filtered && (
        <Button variant="secondary" size="sm" onClick={onReset}>
          Reset filter
        </Button>
      )}
    </div>
  )
}

export { RekapLes }
