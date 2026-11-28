import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import {
  DetailScreen,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Textarea,
  toast,
} from "@/components"
import {
  isNotFoundError,
  sessionQuery,
  submitObjection,
} from "@/features/absensi/api"
import type { AttendanceSession } from "@/types/absensi"
import { formatSessionTitle } from "@/features/absensi/lib"
import { getErrorMessage } from "@/lib/api"
import { formatTimeRange } from "@/lib/format"

/*
 * W5 · Validasi Absensi / Ajukan keberatan (+ frame "- Error")
 *
 * Ringkasan sesi (latar Grayscale/Surface/subtitle) · penjelasan ·
 * Textarea "Alasan keberatan" (wajib, maks. 500). Bilah aksi: Batal ·
 * Kirim Keberatan. Setelah terkirim kembali ke Detail Sesi + toast.
 *
 * Desktop (≥ lg, frame "… (Desktop)"): Page header (kembali "Detail Sesi"),
 * kolom 720px gap 24; tombol rata kanan di bawah garis pada akhir kolom.
 */
const REASON_MAX = 500

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Alasan keberatan wajib diisi.")
    .max(REASON_MAX, `Alasan maksimal ${REASON_MAX} karakter.`),
})
type ObjectionInput = z.infer<typeof schema>

function AjukanKeberatan() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(sessionQuery(sessionId))

  if (query.data?.status === "belum_divalidasi") {
    return <ObjectionForm session={query.data} />
  }

  return (
    <DetailScreen
      title="Ajukan Keberatan"
      desktopHeader="page"
      backLabel="Detail Sesi"
      desktopWidth="wide"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat sesi…" />
      ) : query.isError && !isNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Sesi gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError ? "Sesi tidak ditemukan" : "Sesi sudah divalidasi"
          }
          description="Keberatan hanya bisa diajukan untuk sesi yang belum divalidasi."
          action={{
            label: "Kembali ke Absensi",
            onClick: () => navigate("/wali/absensi", { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

function ObjectionForm({ session }: { session: AttendanceSession }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<ObjectionInput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { reason: "" },
  })
  const { errors } = form.formState
  const reason = useWatch({ control: form.control, name: "reason" })

  const submit = useMutation({
    mutationFn: (values: ObjectionInput) =>
      submitObjection(session.id, values.reason),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(sessionQuery(session.id).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ["absensi", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Keberatan terkirim", {
        description: "Pengelola LBB akan meninjau dan mengabari Anda.",
      })
      navigate(`/wali/absensi/${session.id}`, { replace: true })
    },
    onError: (error) =>
      toast.error("Keberatan gagal dikirim", {
        /* Pesan BE tidak selalu diakhiri titik */
        description: `${getErrorMessage(error).replace(/\.?$/, ".")} Data Anda tetap tersimpan di formulir.`,
      }),
  })

  const counter = `${reason.length}/${REASON_MAX}`

  const actions = (
    <>
      <Button variant="secondary" onClick={() => navigate(-1)}>
        Batal
      </Button>
      <Button
        onClick={form.handleSubmit((values) => submit.mutate(values))}
        disabled={submit.isPending}
      >
        {submit.isPending ? "Mengirim…" : "Kirim Keberatan"}
      </Button>
    </>
  )

  return (
    <DetailScreen
      title="Ajukan Keberatan"
      surface="default"
      desktopHeader="page"
      backLabel="Detail Sesi"
      desktopWidth="wide"
      desktopActions="none"
      className="gap-ns-2xl lg:pt-ns-3xl"
      footer={actions}
    >
      <div className="contents lg:flex lg:max-w-180 lg:flex-col lg:gap-ns-2xl">
        <div className="flex flex-col gap-ns-2xs rounded-(--comp-radius-md) bg-grayscale-surface-subtitle px-ns-l py-ns-m leading-normal">
          <p className="text-subtitle font-bold text-grayscale-text-title">
            {formatSessionTitle(session.subject, session.start)}
          </p>
          <p className="text-caption text-grayscale-text-caption">
            {formatTimeRange(session.start, session.end)} · {session.tutor.name}{" "}
            · Tercatat: {session.studentAttendance}
          </p>
        </div>

        <p className="text-subtitle leading-normal text-grayscale-text-body">
          Jelaskan bagian data kehadiran yang tidak sesuai. Pengelola LBB akan
          meninjau keberatan Anda sebelum presensi diverifikasi.
        </p>

        <form
          noValidate
          aria-label="Formulir keberatan presensi"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field>
            <FieldLabel htmlFor="reason" required>
              Alasan keberatan
            </FieldLabel>
            <Textarea
              id="reason"
              maxLength={REASON_MAX}
              placeholder="Contoh: tutor datang terlambat 30 menit"
              aria-invalid={errors.reason ? true : undefined}
              aria-describedby={errors.reason ? "reason-error" : undefined}
              {...form.register("reason")}
            />
            {errors.reason ? (
              <FieldError id="reason-error" counter={counter}>
                {errors.reason.message}
              </FieldError>
            ) : (
              <FieldDescription counter={counter}>
                Wajib diisi. Tulis sejelas mungkin.
              </FieldDescription>
            )}
          </Field>
        </form>

        <div className="hidden justify-end gap-ns-m border-t border-grayscale-border-default pt-ns-2xl lg:flex">
          {actions}
        </div>
      </div>
    </DetailScreen>
  )
}

export { AjukanKeberatan }
