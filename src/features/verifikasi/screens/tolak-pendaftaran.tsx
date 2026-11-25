import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { z } from "zod"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/ui/data-state"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast-api"
import {
  AlreadyProcessedError,
  canReject,
  gradeLabel,
  NotFoundError,
  REJECT_REASONS,
  registrationQuery,
  rejectRegistration,
  type PengelolaRegistration,
  type RejectReason,
} from "@/features/verifikasi/api/verifikasi"
import { rejectionTemplate } from "@/features/verifikasi/lib/format"

/*
 * P2 · Tolak Pendaftaran · Figma "Verifikasi Pendaftaran / Tolak"
 *
 * Ringkasan pendaftar (latar Grayscale/Surface/subtitle) → Alasan penolakan
 * (Radio, wajib) → Pesan untuk wali (Textarea wajib, maks. 500; terisi
 * templat sesuai alasan dan boleh diubah). Bilah aksi: Batal · Tolak
 * Pendaftaran (Destructive). Setelah terkirim kembali ke detail + toast.
 * Juga dipakai dari P3 ("Tolak pendaftaran" bila tutor belum tersedia);
 * ?alasan=… memilih alasan awal beserta templat pesannya.
 */
const MESSAGE_MAX = 500
const REASON_VALUES = REJECT_REASONS.map((r) => r.value) as [
  RejectReason,
  ...RejectReason[],
]

const schema = z.object({
  reason: z.enum(REASON_VALUES, { error: "Pilih alasan penolakan." }),
  message: z
    .string()
    .trim()
    .min(1, "Pesan untuk wali wajib diisi.")
    .max(MESSAGE_MAX, `Pesan maksimal ${MESSAGE_MAX} karakter.`),
})
type RejectForm = z.infer<typeof schema>

function TolakPendaftaran() {
  const { registrationId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(registrationQuery(registrationId))
  const registration = query.data

  if (registration && canReject(registration)) {
    return <RejectFormScreen registration={registration} />
  }

  return (
    <DetailScreen title="Tolak Pendaftaran">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pendaftaran…" />
      ) : query.isError && !(query.error instanceof NotFoundError) ? (
        <DataState
          state="error"
          title="Pendaftaran gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Pendaftaran tidak ditemukan"
              : "Pendaftaran sudah diproses"
          }
          description="Hanya pendaftaran yang menunggu verifikasi atau belum punya tutor yang bisa ditolak."
          action={{
            label: "Kembali ke Pendaftaran",
            onClick: () =>
              navigate("/pengelola/pendaftaran", { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

function RejectFormScreen({
  registration,
}: {
  registration: PengelolaRegistration
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const initialReason = REASON_VALUES.find((r) => r === params.get("alasan"))
  const form = useForm<RejectForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      reason: initialReason,
      message: initialReason
        ? rejectionTemplate(initialReason, registration)
        : "",
    },
  })
  const { errors } = form.formState
  const message = useWatch({ control: form.control, name: "message" }) ?? ""
  const detailPath = `/pengelola/pendaftaran/${registration.id}`

  /* Ganti alasan → isi templat, kecuali pesan sudah diubah sendiri */
  const changeReason = (
    next: RejectReason,
    previous: RejectReason | undefined
  ) => {
    const current = form.getValues("message").trim()
    const untouched =
      !current ||
      (previous && current === rejectionTemplate(previous, registration))
    if (untouched) {
      form.setValue("message", rejectionTemplate(next, registration), {
        shouldValidate: form.formState.isSubmitted,
      })
    }
  }

  const submit = useMutation({
    mutationFn: (values: RejectForm) =>
      rejectRegistration(registration.id, values),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(
        registrationQuery(registration.id).queryKey,
        updated
      )
      void queryClient.invalidateQueries({ queryKey: ["verifikasi", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Pendaftaran ditolak", {
        description: `Pesan penolakan terkirim ke ${updated.parent.name}.`,
      })
      navigate(detailPath, { replace: true })
    },
    onError: (error) => {
      if (error instanceof AlreadyProcessedError) {
        toast.error("Pendaftaran sudah diproses", {
          description: "Status terbaru ditampilkan.",
        })
        void queryClient.invalidateQueries({ queryKey: ["verifikasi"] })
        navigate(detailPath, { replace: true })
        return
      }
      toast.error("Penolakan gagal dikirim", {
        description:
          "Isian Anda tetap tersimpan. Periksa koneksi lalu coba lagi.",
      })
    },
  })

  const counter = `${message.length}/${MESSAGE_MAX}`

  return (
    <DetailScreen
      title="Tolak Pendaftaran"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={form.handleSubmit((values) => submit.mutate(values))}
            disabled={submit.isPending}
          >
            {submit.isPending ? "Mengirim…" : "Tolak Pendaftaran"}
          </Button>
        </>
      }
    >
      <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
        <p className="text-subtitle text-grayscale-text-title font-bold">
          {registration.student.name} · {gradeLabel(registration.student)}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {registration.needs.subjects.join(", ")} · Wali:{" "}
          {registration.parent.name}
        </p>
      </div>

      <form
        noValidate
        aria-label="Formulir penolakan pendaftaran"
        onSubmit={(e) => e.preventDefault()}
        className="gap-ns-2xl flex flex-col"
      >
        <fieldset
          className="gap-ns-m flex flex-col"
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={errors.reason ? "reason-error" : undefined}
        >
          <legend className="mb-ns-m text-body text-grayscale-text-title leading-normal font-bold">
            Alasan penolakan <span className="text-error">*</span>
          </legend>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? null}
                onValueChange={(v) => {
                  changeReason(v as RejectReason, field.value)
                  field.onChange(v)
                }}
                onBlur={field.onBlur}
                /* Tiap baris setinggi 48px seperti Figma */
                className="gap-0 *:min-h-12"
              >
                {REJECT_REASONS.map((r) => (
                  <RadioGroupItem
                    key={r.value}
                    value={r.value}
                    label={r.label}
                  />
                ))}
              </RadioGroup>
            )}
          />
          {errors.reason && (
            <FieldError id="reason-error">{errors.reason.message}</FieldError>
          )}
        </fieldset>

        <Field>
          <FieldLabel htmlFor="message" required>
            Pesan untuk wali
          </FieldLabel>
          <Textarea
            id="message"
            maxLength={MESSAGE_MAX}
            placeholder={`Jelaskan alasan penolakan kepada ${registration.parent.salutation} ${registration.parent.name}`}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "message-error" : "message-help"}
            {...form.register("message")}
          />
          {errors.message ? (
            <FieldError id="message-error" counter={counter}>
              {errors.message.message}
            </FieldError>
          ) : (
            <FieldDescription id="message-help" counter={counter}>
              Dikirim ke wali bersama notifikasi penolakan.
            </FieldDescription>
          )}
        </Field>
      </form>
    </DetailScreen>
  )
}

export { TolakPendaftaran }
