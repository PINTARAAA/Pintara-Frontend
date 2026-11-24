import { Controller, useFormContext } from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormGroup } from "@/features/pendaftaran/components/form-group"
import {
  GRADE_OPTIONS,
  type PendaftaranInput,
} from "@/features/pendaftaran/schemas/pendaftaran-schema"

/* Langkah 1 · Data Wali & Siswa */
function StepDataSiswa() {
  const { register, control, formState } = useFormContext<PendaftaranInput>()
  const { errors } = formState

  const invalid = (name: keyof PendaftaranInput) =>
    errors[name]
      ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` }
      : {}

  const error = (name: keyof PendaftaranInput) =>
    errors[name] && (
      <FieldError id={`${name}-error`}>{errors[name]?.message}</FieldError>
    )

  return (
    <>
      <FormGroup
        title="Data Wali"
        description="Diambil dari akun Anda. Ubah jika nomor WhatsApp berbeda."
      >
        <Field>
          <FieldLabel htmlFor="parentName" required>
            Nama wali
          </FieldLabel>
          <Input
            id="parentName"
            autoComplete="name"
            placeholder="Masukkan nama wali"
            {...invalid("parentName")}
            {...register("parentName")}
          />
          {error("parentName")}
        </Field>
        <Field>
          <FieldLabel htmlFor="parentPhone" required>
            No. WhatsApp wali
          </FieldLabel>
          <Input
            id="parentPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Contoh: 0812xxxxxxxx"
            {...invalid("parentPhone")}
            {...register("parentPhone")}
          />
          {error("parentPhone")}
        </Field>
      </FormGroup>

      <FormGroup title="Data Siswa">
        <Field>
          <FieldLabel htmlFor="studentName" required>
            Nama lengkap siswa
          </FieldLabel>
          <Input
            id="studentName"
            placeholder="Masukkan nama lengkap siswa"
            {...invalid("studentName")}
            {...register("studentName")}
          />
          {error("studentName")}
        </Field>
        <Field>
          <FieldLabel htmlFor="grade" required>
            Kelas
          </FieldLabel>
          <Controller
            control={control}
            name="grade"
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(v) => {
                  field.onChange((v as string | null) ?? "")
                  field.onBlur()
                }}
              >
                <SelectTrigger
                  id="grade"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  {...invalid("grade")}
                >
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectGroup className="p-0">
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          {error("grade")}
        </Field>
        <Field>
          <FieldLabel htmlFor="school" required>
            Nama sekolah
          </FieldLabel>
          <Input
            id="school"
            placeholder="Contoh: SMP Negeri 1 Bangkalan"
            {...invalid("school")}
            {...register("school")}
          />
          {error("school")}
        </Field>
        <Field>
          <FieldLabel htmlFor="address" required>
            Alamat les
          </FieldLabel>
          <Input
            id="address"
            autoComplete="street-address"
            placeholder="Masukkan alamat lengkap"
            {...invalid("address")}
            {...register("address")}
          />
          {error("address") ?? (
            <FieldDescription>
              Alamat tempat les berlangsung, untuk mencocokkan jarak tutor.
            </FieldDescription>
          )}
        </Field>
      </FormGroup>
    </>
  )
}

export { StepDataSiswa }
