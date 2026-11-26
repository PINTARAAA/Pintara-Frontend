import * as React from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { format, isBefore, startOfDay, addDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  ResultScreen,
  AlertBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  DatePicker,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TimePicker,
  toast,
} from "@/components"
import { addMinutesToTime } from "@/features/jadwal/api"
import {
  DAYS,
  formatRange,
  formatSessions,
  pairDraftQuery,
  saveSchedule,
  scheduleDraftQuery,
  ScheduleConflictError,
  SESSION_MINUTES,
  suggestFreeSlot,
  type Conflict,
  type Pair,
  type ScheduleDraft,
  type ScheduleSession,
} from "@/features/jadwal-les/api"
import { SummaryRow } from "@/features/pendaftaran/components"
import { firstName } from "@/features/penawaran/lib"
import { NotFoundError } from "@/features/verifikasi/api"

/*
 * P5 · Atur Jadwal Les · Figma "Atur Jadwal / Atur jadwal",
 * "/ Error - Bentrok" dan "/ Tersimpan".
 *
 * Ringkasan pasangan (permintaan wali) → Sesi 1…n (Mata pelajaran · Hari,
 * Mulai · Selesai) → Mulai berlaku. Simpan Jadwal memeriksa bentrok dengan
 * jadwal tutor dan siswa (jeda 15 menit); bila bentrok tampil banner error
 * dan field sesi terkait merah. Dipakai untuk penawaran yang diterima
 * (/les/jadwal/atur/:offerId) maupun mengubah jadwal aktif
 * (/les/jadwal/:pairId/ubah).
 */
const LES_JADWAL = "/pengelola/les?tab=jadwal"
const longDate = (date: Date) =>
  format(date, "EEEE, d MMM yyyy", { locale: localeId })

function AturJadwal() {
  const { offerId, pairId } = useParams()
  const options = (
    pairId ? pairDraftQuery(pairId) : scheduleDraftQuery(offerId ?? "")
  ) as UseQueryOptions<ScheduleDraft>
  const query = useQuery(options)
  const navigate = useNavigate()
  const [saved, setSaved] = React.useState<Pair | null>(null)

  if (saved) return <ScheduleSaved pair={saved} />
  if (query.data) {
    return (
      <ScheduleForm
        key={query.dataUpdatedAt}
        draft={query.data}
        onSaved={setSaved}
      />
    )
  }

  return (
    <DetailScreen title="Atur Jadwal Les">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Menyiapkan jadwal…" />
      ) : query.error instanceof NotFoundError ? (
        <DataState
          state="empty"
          title={
            pairId ? "Jadwal tidak ditemukan" : "Penawaran tidak ditemukan"
          }
          description="Jadwal hanya bisa diatur untuk penawaran yang sudah diterima tutor."
          action={{
            label: "Kembali ke Jadwal",
            onClick: () => navigate(LES_JADWAL, { replace: true }),
          }}
        />
      ) : (
        <DataState
          state="error"
          title="Jadwal gagal disiapkan"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      )}
    </DetailScreen>
  )
}

type Errors = Partial<Record<string, string>>

function ScheduleForm({
  draft,
  onSaved,
}: {
  draft: ScheduleDraft
  onSaved: (pair: Pair) => void
}) {
  const queryClient = useQueryClient()
  const [sessions, setSessions] = React.useState<ScheduleSession[]>(
    draft.sessions
  )
  const [effectiveFrom, setEffectiveFrom] = React.useState<Date | null>(
    draft.effectiveFrom
  )
  const [errors, setErrors] = React.useState<Errors>({})
  const [conflict, setConflict] = React.useState<Conflict | null>(null)
  const tomorrow = addDays(startOfDay(new Date()), 1)

  const update = (index: number, patch: Partial<ScheduleSession>) => {
    setSessions((list) =>
      list.map((s, i) => {
        if (i !== index) return s
        const next = { ...s, ...patch }
        /* Mulai diubah → selesai ikut bergeser, durasi tetap 90 menit */
        if (patch.start)
          next.end = addMinutesToTime(patch.start, SESSION_MINUTES)
        return next
      })
    )
    if (conflict?.index === index) setConflict(null)
    setErrors((e) => ({ ...e, [`${index}`]: undefined }))
  }

  const validate = () => {
    const next: Errors = {}
    sessions.forEach((s, i) => {
      if (!s.subject || !s.day || !s.start || !s.end) {
        next[`${i}`] = "Lengkapi mata pelajaran, hari, dan jam."
      } else if (s.end <= s.start) {
        next[`${i}`] = "Jam selesai harus setelah jam mulai."
      }
    })
    if (!effectiveFrom) next.effective = "Pilih tanggal mulai berlaku."
    else if (isBefore(effectiveFrom, tomorrow))
      next.effective = "Mulai berlaku paling cepat besok."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = useMutation({
    mutationFn: () =>
      saveSchedule({
        draft,
        sessions,
        effectiveFrom: effectiveFrom ?? tomorrow,
      }),
    networkMode: "always",
    onSuccess: (pair) => {
      void queryClient.invalidateQueries({ queryKey: ["jadwal-les"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      onSaved(pair)
    },
    onError: (error) => {
      if (error instanceof ScheduleConflictError) {
        setConflict(error.conflict)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
      toast.error("Jadwal gagal disimpan", {
        description:
          "Isian Anda tetap tersimpan. Periksa koneksi lalu coba lagi.",
      })
    },
  })

  return (
    <DetailScreen
      title="Atur Jadwal Les"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <Button
          onClick={() => validate() && save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? "Menyimpan…" : "Simpan Jadwal"}
        </Button>
      }
    >
      {conflict && <ConflictBanner draft={draft} conflict={conflict} />}

      <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
        <p className="text-subtitle text-grayscale-text-title font-bold">
          {draft.student.name} × {draft.tutor.name}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {draft.requested
            ? `Diminta wali: ${draft.requested}`
            : `Jadwal saat ini: ${formatSessions(draft.sessions)}`}
        </p>
      </div>

      <form
        noValidate
        aria-label="Formulir jadwal les"
        onSubmit={(e) => e.preventDefault()}
        className="gap-ns-2xl flex flex-col"
      >
        {sessions.map((session, index) => (
          <SessionFields
            key={index}
            index={index}
            session={session}
            subjects={draft.subjects}
            error={
              errors[`${index}`] ??
              (conflict?.index === index
                ? conflict.with === "siswa"
                  ? "Bentrok dengan jadwal les siswa."
                  : conflict.with === "sesi"
                    ? "Bentrok dengan sesi lain di jadwal ini."
                    : "Bentrok dengan jadwal tutor."
                : undefined)
            }
            timeInvalid={conflict?.index === index}
            onChange={(patch) => update(index, patch)}
          />
        ))}

        <Field>
          <FieldLabel htmlFor="effective-from" required>
            Mulai berlaku
          </FieldLabel>
          <DatePicker
            id="effective-from"
            value={effectiveFrom}
            onValueChange={(d) => {
              setEffectiveFrom(d)
              setErrors((e) => ({ ...e, effective: undefined }))
            }}
            invalid={!!errors.effective}
            calendarProps={{ disabled: { before: tomorrow } }}
          />
          {errors.effective ? (
            <FieldError>{errors.effective}</FieldError>
          ) : (
            <FieldDescription>
              {effectiveFrom && `${longDate(effectiveFrom)}. `}
              Tutor dan wali menerima notifikasi jadwal setelah disimpan.
            </FieldDescription>
          )}
        </Field>
      </form>
    </DetailScreen>
  )
}

function SessionFields({
  index,
  session,
  subjects,
  error,
  timeInvalid,
  onChange,
}: {
  index: number
  session: ScheduleSession
  subjects: string[]
  error?: string
  timeInvalid: boolean
  onChange: (patch: Partial<ScheduleSession>) => void
}) {
  const id = (name: string) => `sesi-${index}-${name}`
  const invalid = !!error

  return (
    <fieldset
      className="gap-ns-m flex flex-col"
      aria-describedby={error ? id("error") : undefined}
    >
      <legend className="mb-ns-m text-body text-grayscale-text-title leading-normal font-bold">
        Sesi {index + 1}
      </legend>
      <div className="gap-ns-m grid grid-cols-2">
        <Field>
          <FieldLabel htmlFor={id("mapel")} required>
            Mata pelajaran
          </FieldLabel>
          <Select
            value={session.subject || null}
            onValueChange={(v) =>
              onChange({ subject: (v as string | null) ?? "" })
            }
          >
            <SelectTrigger id={id("mapel")}>
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={id("hari")} required>
            Hari
          </FieldLabel>
          <Select
            value={session.day || null}
            onValueChange={(v) => onChange({ day: (v as string | null) ?? "" })}
          >
            <SelectTrigger id={id("hari")}>
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="p-0">
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={id("mulai")} required>
            Mulai
          </FieldLabel>
          <TimePicker
            id={id("mulai")}
            start="07.00"
            end="20.30"
            step={15}
            value={session.start || null}
            onValueChange={(v) => onChange({ start: v ?? "" })}
            invalid={timeInvalid || (invalid && !session.start)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("selesai")} required>
            Selesai
          </FieldLabel>
          <TimePicker
            id={id("selesai")}
            start="08.00"
            end="22.00"
            step={15}
            value={session.end || null}
            onValueChange={(v) => onChange({ end: v ?? "" })}
            invalid={timeInvalid || (invalid && !session.end)}
          />
        </Field>
      </div>
      {error && <FieldError id={id("error")}>{error}</FieldError>}
    </fieldset>
  )
}

function ConflictBanner({
  draft,
  conflict,
}: {
  draft: ScheduleDraft
  conflict: Conflict
}) {
  const { other } = conflict
  const when = `setiap ${other.day} ${formatRange(other)}`
  const description =
    conflict.with === "tutor"
      ? `${draft.tutor.shortName} mengajar ${other.studentName} ${when}.`
      : conflict.with === "siswa"
        ? `${firstName(draft.student.name)} sudah les bersama ${other.tutorName} ${when}.`
        : `Sesi ini berimpitan dengan sesi ${other.subject} ${other.day} ${formatRange(other)}.`

  return (
    <AlertBanner
      status="error"
      title={`Jadwal Sesi ${conflict.index + 1} bentrok`}
      description={`${description} Slot kosong ${other.day}: ${suggestFreeSlot(other)}.`}
    />
  )
}

/* "Atur Jadwal / Tersimpan" */
function ScheduleSaved({ pair }: { pair: Pair }) {
  const navigate = useNavigate()
  return (
    <ResultScreen
      title="Jadwal les tersimpan"
      description={`${pair.tutor.shortName} dan ${pair.parentName} (wali ${firstName(pair.student.name)}) sudah menerima notifikasi jadwal.`}
      footer={
        <>
          <Button
            size="lg"
            onClick={() => navigate("/pengelola", { replace: true })}
          >
            Selesai
          </Button>
          <Button
            variant="tertiary"
            onClick={() => navigate(LES_JADWAL, { replace: true })}
          >
            Lihat jadwal aktif
          </Button>
        </>
      }
    >
      <Card size="compact" className="w-full">
        <CardHeader className="gap-ns-2xs">
          <CardTitle>
            {pair.student.name} × {pair.tutor.name}
          </CardTitle>
          <p className="text-caption text-grayscale-text-caption leading-normal">
            Mulai berlaku {longDate(pair.effectiveFrom)}
          </p>
        </CardHeader>
        <CardContent>
          <dl className="gap-ns-m flex flex-col">
            {pair.sessions.map((s, i) => (
              <SummaryRow key={i} label={s.day} align="between">
                {s.subject} · {formatRange(s)}
              </SummaryRow>
            ))}
          </dl>
        </CardContent>
      </Card>
    </ResultScreen>
  )
}

export { AturJadwal }
