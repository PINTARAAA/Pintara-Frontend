import { Controller, useFormContext, useWatch } from "react-hook-form"

import {
  AlertBanner,
  Checkbox,
  Field,
  FieldError,
  FieldLabel,
  TimePicker,
} from "@/components"
import { FormGroup } from "@/features/pendaftaran/components/form-group"
import {
  DAY_OPTIONS,
  SESSION_MINUTES,
  type PendaftaranInput,
} from "@/features/pendaftaran/schemas"

/* Langkah 3 · Jadwal Belajar */
function StepJadwalBelajar() {
  const { control, formState } = useFormContext<PendaftaranInput>()
  const { errors } = formState
  const frequency = useWatch({ control, name: "frequency" })

  return (
    <>
      <FormGroup
        title="Pilihan hari *"
        description={`Pilih hari yang memungkinkan untuk les (sesuai frekuensi: ${frequency || 1} hari).`}
        aria-describedby={errors.days ? "days-error" : undefined}
      >
        <Controller
          control={control}
          name="days"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-x-ns-m gap-y-ns-l lg:grid-cols-6 lg:gap-x-ns-2xl">
              {DAY_OPTIONS.map((day, i) => (
                <Checkbox
                  key={day}
                  label={day}
                  ref={i === 0 ? field.ref : undefined}
                  checked={field.value.includes(day)}
                  aria-invalid={errors.days ? true : undefined}
                  onCheckedChange={(checked) => {
                    field.onChange(
                      checked
                        ? DAY_OPTIONS.filter(
                            (d) => d === day || field.value.includes(d)
                          )
                        : field.value.filter((d) => d !== day)
                    )
                    field.onBlur()
                  }}
                />
              ))}
            </div>
          )}
        />
        {errors.days && (
          <FieldError id="days-error">{errors.days.message}</FieldError>
        )}
      </FormGroup>

      <FormGroup
        title="Waktu belajar *"
        description={`Jam mulai yang diinginkan. Durasi standar ${SESSION_MINUTES} menit per sesi.`}
      >
        {/* Desktop: setengah lebar kolom (Figma: Jam mulai + Spacer) */}
        <Field className="lg:w-[calc(50%-var(--spacing-ns-m))]">
          <FieldLabel htmlFor="startTime" required>
            Jam mulai
          </FieldLabel>
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TimePicker
                id="startTime"
                start="07.00"
                end="20.00"
                placeholder="Pilih jam mulai"
                value={field.value || null}
                onValueChange={(v) => {
                  field.onChange(v ?? "")
                  field.onBlur()
                }}
                invalid={!!errors.startTime}
              />
            )}
          />
          {errors.startTime && (
            <FieldError id="startTime-error">
              {errors.startTime.message}
            </FieldError>
          )}
        </Field>
      </FormGroup>

      <AlertBanner
        status="info"
        title="Jadwal belum final"
        description="Jadwal akan dikonfirmasi Pengelola LBB setelah tutor yang sesuai ditemukan."
      />
    </>
  )
}

export { StepJadwalBelajar }
