import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Textarea,
  TimePicker,
  toast,
} from "@/components"
import { SummaryRow } from "@/features/pendaftaran/components"
import {
  AttendanceError,
  isNotFoundError,
  objectionQuery,
  reviewObjection,
  tutorShortName,
} from "@/features/presensi/api"
import type { TutorSession } from "@/types/presensi"

import { formatLongDate } from "@/features/presensi/lib"
import { formatTimeRange } from "@/lib/format"

/*
 * P6 · Tinjau Keberatan · Figma "Verifikasi Presensi / Tinjau keberatan"
 *
 * Ringkasan sesi (badge Keberatan) → Keberatan wali (pengaju · waktu +
 * kutipan) → Data dari tutor (waktu · kehadiran · materi) → Koreksi waktu
 * pelaksanaan (Mulai · Selesai) → Catatan koreksi (wajib, maks. 500).
 * Bilah aksi: Sesuai Tutor (data tutor dipertahankan) · Simpan Koreksi.
 * Keduanya mengembalikan presensi ke "Siap diverifikasi".
 *
 * Desktop (Figma "… / Tinjau keberatan (Desktop)"): Page header "← Verifikasi
 * Presensi" dengan tombol di kanan; ringkasan selebar konten, lalu Keberatan
 * wali + Data dari tutor di kiri dan formulir koreksi 420px di kanan.
 */
const BACK = "/pengelola/presensi"
const NOTE_MAX = 500
const stamp = (date: Date) => format(date, "d MMM, HH.mm", { locale: localeId })

function TinjauKeberatan() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(objectionQuery(sessionId))
  const session = query.data

  if (session?.record?.validation === "keberatan") {
    return <ReviewForm session={session} />
  }

  return (
    <DetailScreen
      title="Tinjau Keberatan"
      backLabel="Verifikasi Presensi"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat keberatan…" />
      ) : query.isError && !isNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Keberatan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Presensi tidak ditemukan"
              : "Keberatan sudah ditinjau"
          }
          description="Presensi ini sudah kembali ke daftar siap diverifikasi."
          action={{
            label: "Kembali ke Verifikasi Presensi",
            onClick: () => navigate(BACK, { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

function ReviewForm({ session }: { session: TutorSession }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const record = session.record!
  const tutorStart = record.actualStart ?? format(session.start, "HH.mm")
  const tutorEnd = record.actualEnd ?? format(session.end, "HH.mm")

  const [start, setStart] = React.useState<string | null>(tutorStart)
  const [end, setEnd] = React.useState<string | null>(tutorEnd)
  const [note, setNote] = React.useState("")
  const [errors, setErrors] = React.useState<{ time?: string; note?: string }>(
    {}
  )
  const changed = start !== tutorStart || end !== tutorEnd
  const tutor = tutorShortName(session)

  const save = useMutation({
    mutationFn: (corrected: boolean) =>
      reviewObjection(
        session.id,
        corrected
          ? { corrected: true, actualStart: start!, actualEnd: end!, note }
          : { corrected: false, note }
      ),
    networkMode: "always",
    onSuccess: (_, corrected) => {
      void queryClient.invalidateQueries({ queryKey: ["presensi"] })
      void queryClient.invalidateQueries({ queryKey: ["notifikasi"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success(
        corrected ? "Koreksi tersimpan" : "Data tutor dipertahankan",
        {
          description:
            "Hasil tinjauan terkirim ke tutor dan wali. Presensi siap diverifikasi final.",
        }
      )
      navigate(BACK, { replace: true })
    },
    onError: (error) => {
      if (error instanceof AttendanceError) {
        toast.error("Keberatan sudah ditinjau", {
          description: "Status terbaru ditampilkan.",
        })
        void queryClient.invalidateQueries({ queryKey: ["presensi"] })
        navigate(BACK, { replace: true })
        return
      }
      toast.error("Hasil tinjauan gagal disimpan", {
        description:
          "Isian Anda tetap tersimpan. Periksa koneksi lalu coba lagi.",
      })
    },
  })

  const submit = (corrected: boolean) => {
    const next: typeof errors = {}
    if (!note.trim()) next.note = "Catatan koreksi wajib diisi."
    if (corrected) {
      if (!start || !end) next.time = "Lengkapi jam mulai dan selesai."
      else if (end <= start) next.time = "Jam selesai harus setelah jam mulai."
      else if (!changed)
        next.time =
          "Ubah waktunya, atau pilih Sesuai Tutor bila data tutor benar."
    }
    setErrors(next)
    if (Object.keys(next).length === 0) save.mutate(corrected)
  }

  return (
    <DetailScreen
      title="Tinjau Keberatan"
      backLabel="Verifikasi Presensi"
      desktopHeader="page"
      desktopActions="header"
      desktopWidth="wide"
      surface="default"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => submit(false)}
            disabled={save.isPending}
          >
            Sesuai Tutor
          </Button>
          <Button onClick={() => submit(true)} disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan Koreksi"}
          </Button>
        </>
      }
    >
      <div className="gap-ns-s bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col items-start rounded-(--comp-radius-md) leading-normal">
        <p className="text-subtitle text-grayscale-text-title font-bold">
          {session.subject} · {session.student.name}
          {tutor && ` × ${tutor}`}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {formatLongDate(session.start)} · jadwal{" "}
          {formatTimeRange(session.start, session.end)}
        </p>
        <StatusBadge category="presensi" status="keberatan" />
      </div>

      {/*
       * Mobile: ditumpuk. Desktop: Keberatan wali + Data dari tutor di kolom
       * kiri, formulir koreksi 420px di kanan (jarak 40).
       */}
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-x-ns-4xl lg:gap-y-ns-2xl">
        <Card size="compact" className="lg:col-start-1 lg:row-start-1">
          <CardHeader className="gap-ns-2xs">
            <CardTitle>Keberatan wali</CardTitle>
            <p className="text-caption text-grayscale-text-caption leading-normal">
              {session.student.parentSalutation} {session.student.parentName}
              {record.objection && ` · ${stamp(record.objection.at)}`}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-subtitle text-grayscale-text-body leading-normal">
              “{record.objection?.reason}”
            </p>
          </CardContent>
        </Card>

        <Card size="compact" className="lg:col-start-1 lg:row-start-2">
          <CardHeader className="gap-ns-2xs">
            <CardTitle>Data dari tutor</CardTitle>
            <p className="text-caption text-grayscale-text-caption leading-normal">
              Diisi {tutor ?? "tutor"} · {stamp(record.submittedAt)}
            </p>
          </CardHeader>
          <CardContent>
            <dl className="gap-ns-m flex flex-col">
              <SummaryRow label="Waktu" labelClassName="w-[104px]">
                {tutorStart}–{tutorEnd}
              </SummaryRow>
              <SummaryRow label="Kehadiran siswa" labelClassName="w-[104px]">
                {record.studentPresent === false ? "Tidak hadir" : "Hadir"}
              </SummaryRow>
              {record.topic && (
                <SummaryRow label="Materi" labelClassName="w-[104px]">
                  {record.topic}
                </SummaryRow>
              )}
            </dl>
          </CardContent>
        </Card>

        <form
          noValidate
          aria-label="Formulir tinjauan keberatan"
          onSubmit={(e) => e.preventDefault()}
          className="gap-ns-l flex flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <fieldset
            className="gap-ns-m flex flex-col"
            aria-describedby={errors.time ? "time-error" : undefined}
          >
            <legend className="mb-ns-m text-body text-grayscale-text-title leading-normal font-bold">
              Koreksi waktu pelaksanaan
            </legend>
            <div className="gap-ns-m grid grid-cols-2">
              <Field>
                <FieldLabel htmlFor="koreksi-mulai">Mulai</FieldLabel>
                <TimePicker
                  id="koreksi-mulai"
                  start="07.00"
                  end="21.00"
                  step={15}
                  value={start}
                  onValueChange={(v) => {
                    setStart(v)
                    setErrors((e) => ({ ...e, time: undefined }))
                  }}
                  invalid={!!errors.time}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="koreksi-selesai">Selesai</FieldLabel>
                <TimePicker
                  id="koreksi-selesai"
                  start="07.15"
                  end="22.00"
                  step={15}
                  value={end}
                  onValueChange={(v) => {
                    setEnd(v)
                    setErrors((e) => ({ ...e, time: undefined }))
                  }}
                  invalid={!!errors.time}
                />
              </Field>
            </div>
            {errors.time && (
              <FieldError id="time-error">{errors.time}</FieldError>
            )}
          </fieldset>

          <Field>
            <FieldLabel htmlFor="koreksi-catatan" required>
              Catatan koreksi
            </FieldLabel>
            <Textarea
              id="koreksi-catatan"
              maxLength={NOTE_MAX}
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setErrors((er) => ({ ...er, note: undefined }))
              }}
              placeholder={`Contoh: Sudah dikonfirmasi dengan ${tutor ?? "tutor"}…`}
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={errors.note ? "note-error" : "note-help"}
            />
            {errors.note ? (
              <FieldError
                id="note-error"
                counter={`${note.length}/${NOTE_MAX}`}
              >
                {errors.note}
              </FieldError>
            ) : (
              <FieldDescription
                id="note-help"
                counter={`${note.length}/${NOTE_MAX}`}
              >
                Dikirim ke tutor dan wali sebagai hasil peninjauan.
              </FieldDescription>
            )}
          </Field>
        </form>
      </div>
    </DetailScreen>
  )
}

export { TinjauKeberatan }
