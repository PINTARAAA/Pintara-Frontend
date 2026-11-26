import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  ResultScreen,
  AlertBanner,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  TimePicker,
  toast,
} from "@/components"
import {
  formatTimeSlot,
  NotFoundError,
  routineQuery,
  submitScheduleChange,
  WEEKDAYS,
  type ChangeRequest,
  type RoutineDetail,
} from "@/features/jadwal/api/jadwal"
import {
  ChangeProgressCard,
  ChangeSummaryCard,
} from "@/features/jadwal/components/change-request"
import {
  CHANGE_DAY_OPTIONS,
  REASON_MAX,
  withCurrentSchedule,
  type ScheduleChangeInput,
} from "@/features/jadwal/schemas/perubahan-jadwal-schema"
import { FormGroup } from "@/features/pendaftaran/components/form-group"

/*
 * W4 · Jadwal Les / Ajukan perubahan · frame "Ajukan perubahan",
 * "Error - Belum lengkap" dan "Pengajuan terkirim".
 *
 * Jadwal saat ini → Berlaku untuk (sesi terdekat saja / seterusnya mulai
 * minggu berikutnya) → Jadwal alternatif (hari + jam mulai, durasi tetap)
 * → Alasan perubahan (wajib, maks. 500) → banner "Belum langsung berlaku".
 */
function AjukanPerubahan() {
  const { routineId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(routineQuery(routineId))
  const [sent, setSent] = React.useState<ChangeRequest | null>(null)

  if (sent) {
    return (
      <ResultScreen
        title="Pengajuan terkirim"
        description={`Pengelola LBB akan mengonfirmasi dengan ${sent.tutor.shortName} dan mengabari Anda.`}
        align="top"
        footerVariant="bar"
        footer={
          <Button
            onClick={() =>
              navigate(`/wali/jadwal?siswa=${sent.studentId}`, { replace: true })
            }
          >
            Kembali ke Jadwal
          </Button>
        }
      >
        <ChangeSummaryCard request={sent} />
        <ChangeProgressCard request={sent} />
      </ResultScreen>
    )
  }

  if (query.isPending || query.isError || query.data.pendingRequest) {
    return (
      <DetailScreen title="Ajukan Perubahan">
        {query.isPending ? (
          <DataState state="loading" loadingLabel="Memuat jadwal…" />
        ) : query.isError ? (
          query.error instanceof NotFoundError ? (
            <DataState
              state="empty"
              title="Jadwal tidak ditemukan"
              description="Jadwal ini mungkin sudah tidak berlaku."
              action={{
                label: "Kembali ke Jadwal",
                onClick: () => navigate("/wali/jadwal", { replace: true }),
              }}
            />
          ) : (
            <DataState
              state="error"
              title="Jadwal gagal dimuat"
              description="Periksa koneksi Anda, lalu coba lagi."
              action={{ label: "Coba lagi", onClick: () => query.refetch() }}
            />
          )
        ) : (
          <DataState
            state="empty"
            title="Pengajuan sudah ada"
            description="Jadwal ini sudah memiliki pengajuan perubahan yang sedang diproses."
            action={{
              label: "Lihat Pengajuan",
              onClick: () =>
                navigate(
                  `/wali/jadwal/pengajuan/${query.data.pendingRequest?.id}`,
                  { replace: true }
                ),
            }}
          />
        )}
      </DetailScreen>
    )
  }

  return <ChangeForm routine={query.data} onSent={setSent} />
}

const FORM_FIELDS = ["scope", "day", "startTime", "reason"] as const

function ChangeForm({
  routine,
  onSent,
}: {
  routine: RoutineDetail
  onSent: (request: ChangeRequest) => void
}) {
  const queryClient = useQueryClient()
  const [attempted, setAttempted] = React.useState(false)
  const currentDay = WEEKDAYS[routine.weekday]

  const schema = React.useMemo(
    () => withCurrentSchedule({ day: currentDay, startTime: routine.startTime }),
    [currentDay, routine.startTime]
  )
  const form = useForm<ScheduleChangeInput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      scope: "",
      day: "",
      startTime: routine.startTime,
      reason: "",
    },
  })
  const { errors } = form.formState
  const startTime = useWatch({ control: form.control, name: "startTime" })
  const reason = useWatch({ control: form.control, name: "reason" })

  const submit = useMutation({
    mutationFn: (values: ScheduleChangeInput) =>
      submitScheduleChange(routine.id, values),
    networkMode: "always",
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: ["jadwal"] })
      window.scrollTo({ top: 0 })
      onSent(request)
    },
    onError: () => {
      toast.error("Pengajuan gagal dikirim", {
        description:
          "Data Anda tetap tersimpan di formulir. Periksa koneksi lalu coba lagi.",
      })
    },
  })

  const handleSubmit = () => {
    setAttempted(true)
    void form.handleSubmit(
      (values) => submit.mutate(values),
      () => window.scrollTo({ top: 0, behavior: "smooth" })
    )()
  }

  /* "Sesi Rabu, 25 Nov saja" · "Seterusnya, mulai 2 Des 2026" */
  const next = routine.nextSession
  const following = new Date(next.getTime() + 7 * 86_400_000)
  const scopeOptions = [
    {
      value: "sekali",
      label: `Sesi ${currentDay}, ${format(next, "d MMM", { locale: localeId })} saja`,
    },
    {
      value: "seterusnya",
      label: `Seterusnya, mulai ${format(following, "d MMM yyyy", { locale: localeId })}`,
    },
  ]

  const missing = FORM_FIELDS.filter((name) => errors[name])
  const bannerDescription =
    missing.length === 1 && missing[0] === "reason"
      ? "Isi alasan perubahan agar Pengelola LBB bisa menindaklanjuti."
      : `Lengkapi ${missing.length} data wajib agar Pengelola LBB bisa menindaklanjuti.`

  /* Tandai "touched" saat berubah agar error hilang tanpa menunggu blur */
  const touch = (name: keyof ScheduleChangeInput) => () =>
    form.trigger(name)

  return (
    <DetailScreen
      title="Ajukan Perubahan"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <Button onClick={handleSubmit} disabled={submit.isPending}>
          {submit.isPending ? "Mengirim…" : "Kirim Pengajuan"}
        </Button>
      }
    >
      <form
        noValidate
        aria-label="Formulir pengajuan perubahan jadwal"
        onSubmit={(e) => e.preventDefault()}
        className="contents"
      >
        {attempted && missing.length > 0 && (
          <AlertBanner
            status="error"
            title="Pengajuan belum lengkap"
            description={bannerDescription}
          />
        )}

        <div className="flex flex-col gap-ns-2xs rounded-(--comp-radius-md) bg-grayscale-surface-subtitle px-ns-l py-ns-m leading-normal">
          <p className="text-caption text-grayscale-text-caption">
            Jadwal saat ini
          </p>
          <p className="text-subtitle font-bold text-grayscale-text-title">
            {routine.subject} · {currentDay},{" "}
            {formatTimeSlot(routine.startTime, routine.durationMinutes)}
          </p>
        </div>

        <FormGroup title="Berlaku untuk *" className="gap-ns-m">
          <Controller
            control={form.control}
            name="scope"
            render={({ field }) => (
              <RadioGroup
                aria-label="Berlaku untuk"
                aria-describedby={errors.scope ? "scope-error" : undefined}
                value={field.value || null}
                onValueChange={(v) => {
                  field.onChange(v as string)
                  void touch("scope")()
                }}
                className="gap-ns-m"
              >
                {scopeOptions.map((option, i) => (
                  <RadioGroupItem
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    ref={i === 0 ? field.ref : undefined}
                    aria-invalid={errors.scope ? true : undefined}
                  />
                ))}
              </RadioGroup>
            )}
          />
          {errors.scope && (
            <FieldError id="scope-error">{errors.scope.message}</FieldError>
          )}
        </FormGroup>

        <FormGroup title="Jadwal alternatif *" className="gap-ns-m">
          <div className="grid grid-cols-2 gap-ns-m">
            <Field>
              <FieldLabel htmlFor="day">Hari</FieldLabel>
              <Controller
                control={form.control}
                name="day"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(v) => {
                      field.onChange((v as string | null) ?? "")
                      void touch("day")()
                    }}
                  >
                    <SelectTrigger
                      id="day"
                      ref={field.ref}
                      aria-invalid={errors.day ? true : undefined}
                      aria-describedby={errors.day ? "day-error" : undefined}
                    >
                      <SelectValue placeholder="Pilih hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup className="p-0">
                        {CHANGE_DAY_OPTIONS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="startTime">Jam mulai</FieldLabel>
              <Controller
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <TimePicker
                    id="startTime"
                    start="07.00"
                    end="20.00"
                    value={field.value || null}
                    onValueChange={(v) => {
                      field.onChange(v ?? "")
                      void touch("startTime")()
                      if (form.getFieldState("day").isTouched) void touch("day")()
                    }}
                    invalid={!!errors.startTime}
                  />
                )}
              />
            </Field>
          </div>
          {errors.day || errors.startTime ? (
            <FieldError id="day-error">
              {errors.day?.message ?? errors.startTime?.message}
            </FieldError>
          ) : (
            <FieldDescription>
              Durasi tetap {routine.durationMinutes} menit (
              {startTime
                ? formatTimeSlot(startTime, routine.durationMinutes)
                : "-"}
              ).
            </FieldDescription>
          )}
        </FormGroup>

        <Field>
          <FieldLabel htmlFor="reason" required>
            Alasan perubahan
          </FieldLabel>
          <Textarea
            id="reason"
            maxLength={REASON_MAX}
            placeholder={`Contoh: ada kegiatan sekolah di hari ${currentDay}`}
            aria-invalid={errors.reason ? true : undefined}
            aria-describedby={errors.reason ? "reason-error" : undefined}
            {...form.register("reason")}
          />
          {errors.reason ? (
            <FieldError
              id="reason-error"
              counter={`${reason.length}/${REASON_MAX}`}
            >
              {errors.reason.message}
            </FieldError>
          ) : (
            <FieldDescription counter={`${reason.length}/${REASON_MAX}`}>
              Dibaca Pengelola LBB dan tutor.
            </FieldDescription>
          )}
        </Field>

        <AlertBanner
          status="info"
          title="Belum langsung berlaku"
          description="Jadwal lama tetap berjalan sampai Pengelola LBB dan tutor menyetujui perubahan."
        />
      </form>
    </DetailScreen>
  )
}

export { AjukanPerubahan }
