import { Controller, useFormContext } from "react-hook-form"

import {
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
} from "@/components"
import { FormGroup } from "@/features/pendaftaran/components/form-group"
import {
  FREQUENCY_OPTIONS,
  SUBJECT_OPTIONS,
  type PendaftaranInput,
} from "@/features/pendaftaran/schemas"

/* Langkah 2 · Kebutuhan Belajar */
function StepKebutuhanBelajar() {
  const { register, control, formState } = useFormContext<PendaftaranInput>()
  const { errors } = formState

  return (
    <>
      <FormGroup
        title="Mata pelajaran *"
        description="Pilih satu atau lebih mata pelajaran."
        aria-describedby={errors.subjects ? "subjects-error" : undefined}
      >
        <Controller
          control={control}
          name="subjects"
          render={({ field }) => (
            /* Desktop: tiga kolom (Figma "Row" × 2) */
            <div className="contents lg:grid lg:grid-cols-3 lg:gap-x-ns-2xl lg:gap-y-ns-l">
              {SUBJECT_OPTIONS.map((subject, i) => (
                <Checkbox
                  key={subject}
                  label={subject}
                  ref={i === 0 ? field.ref : undefined}
                  checked={field.value.includes(subject)}
                  aria-invalid={errors.subjects ? true : undefined}
                  onCheckedChange={(checked) => {
                    field.onChange(
                      checked
                        ? SUBJECT_OPTIONS.filter(
                            (s) => s === subject || field.value.includes(s)
                          )
                        : field.value.filter((s) => s !== subject)
                    )
                    field.onBlur()
                  }}
                />
              ))}
            </div>
          )}
        />
        {errors.subjects && (
          <FieldError id="subjects-error">{errors.subjects.message}</FieldError>
        )}
      </FormGroup>

      <FormGroup
        title="Frekuensi les *"
        description="Jumlah pertemuan per minggu."
      >
        <Controller
          control={control}
          name="frequency"
          render={({ field }) => (
            <RadioGroup
              aria-label="Frekuensi les"
              aria-describedby={
                errors.frequency ? "frequency-error" : undefined
              }
              value={field.value || null}
              onValueChange={(v) => {
                field.onChange(v as string)
                field.onBlur()
              }}
              className="gap-ns-l lg:grid lg:grid-cols-3 lg:gap-x-ns-2xl"
            >
              {FREQUENCY_OPTIONS.map((option, i) => (
                <RadioGroupItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  ref={i === 0 ? field.ref : undefined}
                  aria-invalid={errors.frequency ? true : undefined}
                />
              ))}
            </RadioGroup>
          )}
        />
        {errors.frequency && (
          <FieldError id="frequency-error">
            {errors.frequency.message}
          </FieldError>
        )}
      </FormGroup>

      <FormGroup title="Catatan kebutuhan belajar">
        <Field>
          <FieldLabel htmlFor="notes">Catatan</FieldLabel>
          <Input
            id="notes"
            placeholder="Contoh: persiapan ujian akhir semester"
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? "notes-error" : undefined}
            {...register("notes")}
          />
          {errors.notes ? (
            <FieldError id="notes-error">{errors.notes.message}</FieldError>
          ) : (
            <FieldDescription>
              Opsional. Bantu kami memilih tutor yang tepat.
            </FieldDescription>
          )}
        </Field>
      </FormGroup>
    </>
  )
}

export { StepKebutuhanBelajar }
