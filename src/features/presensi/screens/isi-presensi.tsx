import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  ResultScreen,
  AlertBanner,
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
  FileUpload,
  type UploadStatus,
  Input,
  RadioGroup,
  RadioGroupItem,
  Textarea,
  TimePicker,
  toast,
} from "@/components"
import { FormGroup, SummaryRow } from "@/features/pendaftaran/components"
import {
  attendanceErrorCode,
  DOC_ACCEPT,
  isNotFoundError,
  submitAttendance,
  tutorSessionQuery,
  uploadDocumentation,
  validateDocumentation,
} from "@/features/presensi/api"
import type { AttendanceInput, TutorSession } from "@/types/presensi"
import { formatLongDate, sessionTitle } from "@/features/presensi/lib"
import { firstName, formatDateTime, formatTimeRange } from "@/lib/format"
import { getErrorMessage } from "@/lib/api"

/*
 * T2 · Isi Presensi · Figma "Presensi / Form - Terlaksana", "- Tidak
 * terlaksana", "Error - Isian belum lengkap", "Tersimpan" dan "Error -
 * Sudah terisi".
 *
 * Status sesi menentukan isian: terlaksana → waktu pelaksanaan, kehadiran
 * siswa, materi (wajib), catatan, dokumentasi; tidak terlaksana → alasan
 * (wajib) + info "tidak dihitung dalam rekap honor".
 * Setiap sesi hanya bisa dipresensi sekali.
 *
 * Desktop (≥ lg, frame "… (Desktop)"): halaman putih, Page header (kembali
 * "Presensi", judul "Isi Presensi"). Form: ringkasan sesi selebar halaman,
 * isian dua kolom (jarak 40) — kiri status/waktu/kehadiran (pilihan radio
 * berdampingan), kanan materi/catatan/dokumentasi atau alasan + info —
 * lalu [Batal] [Simpan Presensi] rata kanan di bawah garis. Sudah terisi:
 * selebar 720px, tombol di bawah garis. Tersimpan: hasil di tengah halaman.
 */
const NOTES_MAX = 500
/* Grup isian: desktop tanpa garis atas FormGroup (Figma T2) */
const GROUP = "gap-ns-m lg:border-t-0 lg:pt-0"
/* Pilihan radio: bertumpuk di mobile, berdampingan di desktop */
const RADIOS = "gap-ns-m lg:grid-cols-2 lg:gap-ns-2xl"

function IsiPresensi() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(tutorSessionQuery(sessionId))
  const [saved, setSaved] = React.useState<TutorSession | null>(null)
  const session = query.data

  if (saved) return <SavedScreen session={saved} />

  if (session && !session.record && session.start <= new Date()) {
    return <AttendanceForm session={session} onSaved={setSaved} />
  }

  return (
    <DetailScreen
      title="Isi Presensi"
      desktopHeader="page"
      backLabel="Presensi"
      desktopWidth="form"
      className="lg:pt-ns-3xl"
      footer={
        session?.record && (
          <Button
            onClick={() => navigate(`/tutor/presensi/status/${session.id}`)}
          >
            Lihat Status Presensi
          </Button>
        )
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat sesi…" />
      ) : query.isError ? (
        isNotFoundError(query.error) ? (
          <DataState
            state="empty"
            title="Sesi tidak ditemukan"
            description="Sesi ini mungkin sudah dihapus dari jadwal."
            action={{
              label: "Kembali ke Presensi",
              onClick: () => navigate("/tutor/presensi", { replace: true }),
            }}
          />
        ) : (
          <DataState
            state="error"
            title="Sesi gagal dimuat"
            description={getErrorMessage(query.error)}
            action={{ label: "Coba lagi", onClick: () => query.refetch() }}
          />
        )
      ) : session?.record ? (
        <>
          <AlertBanner
            status="warning"
            title="Presensi sesi ini sudah diisi"
            description={`Tercatat pada ${formatDateTime(session.record.submittedAt)}. Setiap sesi hanya bisa memiliki satu presensi.`}
          />
          <AttendanceSummary session={session} />
          <p className="text-caption leading-normal text-grayscale-text-caption">
            Perlu mengubah data? Hubungi Pengelola LBB untuk koreksi presensi.
          </p>
        </>
      ) : session ? (
        <DataState
          state="empty"
          title="Sesi belum dimulai"
          description={`Presensi bisa diisi mulai ${format(session.start, "HH.mm")}.`}
          action={{
            label: "Kembali ke Presensi",
            onClick: () => navigate("/tutor/presensi", { replace: true }),
          }}
        />
      ) : null}
    </DetailScreen>
  )
}

/* ---------- Form ---------- */

type Errors = Partial<
  Record<"time" | "topic" | "file" | "cancelReason", string>
>

type DocState = {
  file: File | null
  status: UploadStatus
  progress: number
  error: string | null
}

const EMPTY_DOC: DocState = {
  file: null,
  status: "idle",
  progress: 0,
  error: null,
}

function AttendanceForm({
  session,
  onSaved,
}: {
  session: TutorSession
  onSaved: (session: TutorSession) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scheduled = {
    start: format(session.start, "HH.mm"),
    end: format(session.end, "HH.mm"),
  }

  const [held, setHeld] = React.useState<"ya" | "tidak">("ya")
  const [start, setStart] = React.useState(scheduled.start)
  const [end, setEnd] = React.useState(scheduled.end)
  const [present, setPresent] = React.useState<"hadir" | "tidak">("hadir")
  const [topic, setTopic] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [doc, setDoc] = React.useState<DocState>(EMPTY_DOC)
  const [errors, setErrors] = React.useState<Errors>({})
  const [attempted, setAttempted] = React.useState(false)
  const cancelUpload = React.useRef<(() => void) | null>(null)

  React.useEffect(() => () => cancelUpload.current?.(), [])

  const clearError = (key: keyof Errors) =>
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })

  const selectFile = (file: File) => {
    cancelUpload.current?.()
    const invalid = validateDocumentation(file)
    if (invalid) {
      setDoc({ file, status: "error", progress: 0, error: invalid })
      setErrors((prev) => ({ ...prev, file: invalid }))
      return
    }
    clearError("file")
    setDoc({ file, status: "uploading", progress: 0, error: null })
    cancelUpload.current = uploadDocumentation(file, {
      onProgress: (progress) => setDoc((d) => ({ ...d, progress })),
      onDone: () => setDoc((d) => ({ ...d, status: "success", progress: 100 })),
      onError: (reason) => {
        const message = `Unggahan gagal. ${reason}`
        setDoc((d) => ({ ...d, status: "error", error: message }))
        setErrors((prev) => ({ ...prev, file: message }))
      },
    })
  }

  const removeFile = () => {
    cancelUpload.current?.()
    setDoc(EMPTY_DOC)
    clearError("file")
  }

  const validate = (): Errors => {
    const next: Errors = {}
    if (held === "ya") {
      if (!start || !end) next.time = "Pilih jam mulai dan selesai."
      else if (end <= start) next.time = "Jam selesai harus setelah jam mulai."
      if (!topic.trim()) next.topic = "Materi pembelajaran wajib diisi."
      if (doc.status === "error") next.file = doc.error ?? "Unggahan gagal."
      if (doc.status === "uploading")
        next.file = "Tunggu hingga file selesai diunggah."
    } else if (!reason.trim()) {
      next.cancelReason = "Alasan tidak terlaksana wajib diisi."
    }
    return next
  }

  const submit = useMutation({
    mutationFn: (input: AttendanceInput) => submitAttendance(session.id, input),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(tutorSessionQuery(session.id).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ["presensi", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "tutor"] })
      window.scrollTo({ top: 0 })
      onSaved(updated)
    },
    onError: (error) => {
      const code = attendanceErrorCode(error)
      if (code === "already_filled") {
        void queryClient.invalidateQueries({ queryKey: ["presensi"] })
        toast.warning("Presensi sesi ini sudah diisi", {
          description: "Data terbaru sedang dimuat.",
        })
        return
      }
      if (code === "not_started") {
        toast.warning("Sesi belum dimulai", {
          description: "Presensi bisa diisi setelah jam mulai sesi.",
        })
        return
      }
      toast.error("Presensi gagal disimpan", {
        description: `${getErrorMessage(error)} Isian Anda tetap tersimpan di formulir.`,
      })
    },
  })

  const handleSubmit = () => {
    setAttempted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    submit.mutate(
      held === "ya"
        ? {
            held: true,
            actualStart: start,
            actualEnd: end,
            studentPresent: present === "hadir",
            topic,
            notes,
            attachment:
              doc.file && doc.status === "success"
                ? { name: doc.file.name, size: doc.file.size }
                : undefined,
          }
        : { held: false, cancelReason: reason }
    )
  }

  const errorCount = Object.keys(errors).length

  return (
    <DetailScreen
      title="Isi Presensi"
      surface="default"
      className="gap-ns-2xl lg:pt-ns-3xl"
      onBack={() => navigate(-1)}
      desktopHeader="page"
      backLabel="Presensi"
      desktopWidth="wide"
      /* Desktop: [Batal] [Simpan Presensi] dirender sendiri di akhir form */
      desktopActions="none"
      footer={
        <Button onClick={handleSubmit} disabled={submit.isPending}>
          {submit.isPending ? "Menyimpan…" : "Simpan Presensi"}
        </Button>
      }
    >
      {attempted && errorCount > 0 && (
        <AlertBanner
          status="error"
          title="Presensi belum bisa disimpan"
          description={`Periksa ${errorCount} isian yang ditandai merah. Isian lain tetap tersimpan.`}
        />
      )}

      <div className="flex flex-col gap-ns-2xs rounded-(--comp-radius-md) bg-grayscale-surface-subtitle px-ns-l py-ns-m leading-normal">
        <p className="text-subtitle font-bold text-grayscale-text-title">
          {sessionTitle(session)}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {formatLongDate(session.start)} · Jadwal{" "}
          {formatTimeRange(session.start, session.end)}
        </p>
      </div>

      <form
        noValidate
        aria-label="Formulir presensi"
        onSubmit={(e) => e.preventDefault()}
        className="contents lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-ns-4xl"
      >
        {/* Kolom kiri (desktop): status, waktu, kehadiran */}
        <div className="contents lg:flex lg:flex-col lg:gap-ns-2xl">
          <FormGroup title="Status sesi *" className={GROUP}>
            <RadioGroup
              aria-label="Status sesi"
              value={held}
              onValueChange={(v) => {
                setHeld(v as typeof held)
                setErrors({})
              }}
              className={RADIOS}
            >
              <RadioGroupItem value="ya" label="Terlaksana" />
              <RadioGroupItem value="tidak" label="Tidak terlaksana" />
            </RadioGroup>
          </FormGroup>

          {held === "ya" && (
            <>
              <FormGroup title="Waktu pelaksanaan *" className={GROUP}>
                <div className="grid grid-cols-2 gap-ns-m">
                  <Field>
                    <FieldLabel htmlFor="start">Mulai</FieldLabel>
                    <TimePicker
                      id="start"
                      start="06.00"
                      end="21.00"
                      step={15}
                      value={start || null}
                      invalid={!!errors.time}
                      onValueChange={(v) => {
                        setStart(v ?? "")
                        clearError("time")
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="end">Selesai</FieldLabel>
                    <TimePicker
                      id="end"
                      start="06.00"
                      end="22.00"
                      step={15}
                      value={end || null}
                      invalid={!!errors.time}
                      onValueChange={(v) => {
                        setEnd(v ?? "")
                        clearError("time")
                      }}
                    />
                  </Field>
                </div>
                {errors.time && <FieldError>{errors.time}</FieldError>}
              </FormGroup>

              <FormGroup title="Kehadiran siswa *" className={GROUP}>
                <RadioGroup
                  aria-label="Kehadiran siswa"
                  value={present}
                  onValueChange={(v) => setPresent(v as typeof present)}
                  className={RADIOS}
                >
                  <RadioGroupItem value="hadir" label="Hadir" />
                  <RadioGroupItem value="tidak" label="Tidak hadir" />
                </RadioGroup>
              </FormGroup>
            </>
          )}
        </div>

        {/* Kolom kanan (desktop): isian teks & dokumentasi, atau alasan */}
        <div className="contents lg:flex lg:flex-col lg:gap-ns-2xl">
          {held === "ya" ? (
            <>
              <Field>
                <FieldLabel htmlFor="topic" required>
                  Materi pembelajaran
                </FieldLabel>
                <Input
                  id="topic"
                  placeholder="Contoh: Getaran dan gelombang"
                  value={topic}
                  aria-invalid={errors.topic ? true : undefined}
                  aria-describedby={errors.topic ? "topic-error" : undefined}
                  onChange={(e) => {
                    setTopic(e.target.value)
                    clearError("topic")
                  }}
                />
                {errors.topic && (
                  <FieldError id="topic-error">{errors.topic}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Catatan pembelajaran</FieldLabel>
                <Textarea
                  id="notes"
                  maxLength={NOTES_MAX}
                  placeholder="Contoh: perkembangan siswa dan latihan berikutnya"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <FieldDescription counter={`${notes.length}/${NOTES_MAX}`}>
                  Opsional. Dapat dibaca wali murid.
                </FieldDescription>
              </Field>

              <FileUpload
                id="documentation"
                label="Dokumentasi sesi"
                accept={DOC_ACCEPT}
                helper="JPG, PNG, atau PDF · maks. 5 MB"
                file={doc.file}
                status={doc.status}
                progress={doc.progress}
                error={doc.status === "error" ? doc.error : errors.file}
                onSelect={selectFile}
                onRemove={removeFile}
              />
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="reason" required>
                  Alasan tidak terlaksana
                </FieldLabel>
                <Textarea
                  id="reason"
                  maxLength={NOTES_MAX}
                  placeholder="Contoh: siswa sakit, wali membatalkan pukul 14.00"
                  value={reason}
                  aria-invalid={errors.cancelReason ? true : undefined}
                  aria-describedby={
                    errors.cancelReason ? "reason-error" : undefined
                  }
                  onChange={(e) => {
                    setReason(e.target.value)
                    clearError("cancelReason")
                  }}
                />
                {errors.cancelReason ? (
                  <FieldError
                    id="reason-error"
                    counter={`${reason.length}/${NOTES_MAX}`}
                  >
                    {errors.cancelReason}
                  </FieldError>
                ) : (
                  <FieldDescription counter={`${reason.length}/${NOTES_MAX}`}>
                    Wajib diisi agar Pengelola LBB dapat menindaklanjuti.
                  </FieldDescription>
                )}
              </Field>
              <AlertBanner
                status="info"
                title="Tidak dihitung dalam rekap honor"
                description="Sesi yang tidak terlaksana tercatat di riwayat, tetapi tidak masuk perhitungan honor."
              />
            </>
          )}
        </div>
      </form>

      <div className="hidden justify-end gap-ns-m border-t border-grayscale-border-default pt-ns-2xl lg:flex">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={submit.isPending}>
          {submit.isPending ? "Menyimpan…" : "Simpan Presensi"}
        </Button>
      </div>
    </DetailScreen>
  )
}

/* ---------- Ringkasan & hasil ---------- */

function AttendanceSummary({ session }: { session: TutorSession }) {
  const record = session.record
  return (
    <Card size="compact" className="w-full text-left">
      <CardHeader>
        <CardTitle>Ringkasan Presensi</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-ns-m">
          <SummaryRow label="Sesi" align="between">
            {sessionTitle(session)}
          </SummaryRow>
          <SummaryRow label="Tanggal" align="between">
            {formatLongDate(session.start)}
          </SummaryRow>
          <SummaryRow label="Waktu" align="between">
            {record?.held
              ? `${record.actualStart}–${record.actualEnd}`
              : "Tidak terlaksana"}
          </SummaryRow>
          {record?.held ? (
            <SummaryRow label="Kehadiran siswa" align="between">
              {record.studentPresent ? "Hadir" : "Tidak hadir"}
            </SummaryRow>
          ) : (
            <SummaryRow label="Alasan" align="between">
              {record?.cancelReason}
            </SummaryRow>
          )}
          {record && (
            <SummaryRow label="Status" align="between">
              <StatusBadge category="presensi" status={record.validation} />
            </SummaryRow>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

function SavedScreen({ session }: { session: TutorSession }) {
  const navigate = useNavigate()
  const held = session.record?.held

  return (
    <ResultScreen
      title="Presensi tersimpan"
      pageTitle="Isi Presensi"
      description={
        held
          ? `Menunggu validasi dari ${session.student.parentName}, wali ${firstName(session.student.name)}. Anda akan diberi tahu jika ada keberatan.`
          : "Sesi tercatat tidak terlaksana. Pengelola LBB akan menindaklanjuti bila perlu."
      }
      footer={
        <>
          <Button
            size="lg"
            onClick={() => navigate("/tutor/presensi", { replace: true })}
          >
            Kembali ke Presensi
          </Button>
          <Button
            variant="tertiary"
            onClick={() =>
              navigate(`/tutor/presensi/status/${session.id}`, {
                replace: true,
              })
            }
          >
            Lihat status presensi
          </Button>
        </>
      }
    >
      <AttendanceSummary session={session} />
    </ResultScreen>
  )
}

export { IsiPresensi }
