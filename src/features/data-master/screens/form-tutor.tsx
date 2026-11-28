import type * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Controller,
  useForm,
  type Control,
  type FieldPath,
} from "react-hook-form"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  Button,
  Checkbox,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  TimePicker,
  toast,
  PhoneInput,
} from "@/components"
import {
  isDuplicateEmailError,
  NotFoundError,
  saveTutor,
  tutorQuery,
} from "@/features/data-master/api"
import { DAYS, LEVELS, TUTOR_SUBJECTS } from "@/lib/data/data-master"
import type { Level, Tutor } from "@/types/data-master"
import {
  EMPTY_TUTOR,
  tutorSchema,
  type TutorFormInput,
} from "@/features/data-master/schemas"
import { FormGroup } from "@/features/pendaftaran/components"
import { getErrorMessage } from "@/lib/api"
import { formatPhone, formatRupiah } from "@/lib/format"

/*
 * P9 · Tambah Tutor / Ubah Profil Tutor · Figma "Data Tutor / Tambah tutor".
 *
 * Identitas (nama, WhatsApp, email) → Kualifikasi (pendidikan, mapel,
 * jenjang) → Ketersediaan & lokasi (hari, jam mulai–selesai, alamat) →
 * Honor (tarif per sesi). Mode ubah (/tutor/:id/ubah) memakai formulir yang
 * sama dengan isian profil saat ini.
 */
const digitsOnly = (value: string) => Number(value.replace(/\D/g, "")) || 0

const toForm = (t: Tutor): TutorFormInput => ({
  name: t.name.replace(/^Kak\s+/, ""),
  phone: formatPhone(t.phone),
  email: t.email,
  education: t.education,
  subjects: t.subjects,
  levels: t.levels,
  days: t.days,
  from: t.from,
  until: t.until,
  address: t.address,
  rate: t.rate ?? 0,
})

function FormTutor() {
  const { tutorId } = useParams()
  const navigate = useNavigate()
  const query = useQuery({ ...tutorQuery(tutorId ?? ""), enabled: !!tutorId })

  if (!tutorId) return <TutorForm />
  if (query.data) return <TutorForm tutor={query.data} />

  return (
    <DetailScreen
      title="Ubah Profil Tutor"
      backLabel="Profil Tutor"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat profil tutor…" />
      ) : query.error instanceof NotFoundError ? (
        <DataState
          state="empty"
          title="Tutor tidak ditemukan"
          description="Data tutor ini mungkin sudah dihapus atau tautannya keliru."
          action={{
            label: "Kembali ke Data Tutor",
            onClick: () => navigate("/pengelola/tutor", { replace: true }),
          }}
        />
      ) : (
        <DataState
          state="error"
          title="Profil tutor gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      )}
    </DetailScreen>
  )
}

function TutorForm({ tutor }: { tutor?: Tutor }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<TutorFormInput>({
    resolver: zodResolver(tutorSchema),
    mode: "onTouched",
    defaultValues: tutor ? toForm(tutor) : EMPTY_TUTOR,
  })
  const { register, control, formState, setError } = form
  const { errors } = formState

  const save = useMutation({
    mutationFn: (values: TutorFormInput) =>
      saveTutor({ ...values, levels: values.levels as Level[] }, tutor?.id),
    networkMode: "always",
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["data-master", "tutor"] })
      toast.success(tutor ? "Profil tutor diperbarui" : "Tutor ditambahkan", {
        description: tutor
          ? undefined
          : `Undangan login dikirim ke ${saved.email}.`,
      })
      /* Ubah → kembali ke profil; Tambah → ganti formulir dengan profil baru */
      if (tutor) navigate(-1)
      else navigate(`/pengelola/tutor/${saved.id}`, { replace: true })
    },
    onError: (error) => {
      if (isDuplicateEmailError(error)) {
        setError(
          "email",
          { message: "Email sudah dipakai akun lain. Gunakan email berbeda." },
          { shouldFocus: true }
        )
      } else {
        toast.error("Tutor gagal disimpan", {
          /* Pesan BE tidak selalu diakhiri titik */
          description: `${getErrorMessage(error).replace(/\.?$/, ".")} Isian Anda tetap tersimpan.`,
        })
      }
    },
  })

  const submit = form.handleSubmit((values) => save.mutate(values))

  return (
    <DetailScreen
      title={tutor ? "Ubah Profil Tutor" : "Tambah Tutor"}
      backLabel={tutor ? "Profil Tutor" : "Data Tutor"}
      desktopHeader="page"
      desktopWidth="wide"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <>
          {/* Figma: Batal hanya ada di desktop */}
          <Button
            variant="secondary"
            className="hidden lg:inline-flex"
            onClick={() => navigate(-1)}
          >
            Batal
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending
              ? "Menyimpan…"
              : tutor
                ? "Simpan Perubahan"
                : "Simpan Tutor"}
          </Button>
        </>
      }
    >
      <form
        noValidate
        aria-label={tutor ? "Formulir ubah tutor" : "Formulir tambah tutor"}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        /*
         * Desktop (Figma "Data Tutor / Tambah tutor (Desktop)"): dua kolom,
         * Identitas + Kualifikasi di kiri, Ketersediaan + Honor di kanan
         */
        className="gap-ns-2xl flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12"
      >
        <div className="lg:gap-ns-2xl contents lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
          <Section title="Identitas">
            <Field>
              <FieldLabel htmlFor="name" required>
                Nama lengkap
              </FieldLabel>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
              {errors.name && (
                <FieldError id="name-error">{errors.name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="phone" required>
                No. WhatsApp
              </FieldLabel>
              <PhoneInput
                id="phone"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                {...register("phone")}
              />
              {errors.phone && (
                <FieldError id="phone-error">{errors.phone.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email" required>
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="nama@email.com"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : "email-help"}
                {...register("email")}
              />
              {errors.email ? (
                <FieldError id="email-error">{errors.email.message}</FieldError>
              ) : (
                <FieldDescription id="email-help">
                  Dipakai untuk login dan notifikasi.
                </FieldDescription>
              )}
            </Field>
          </Section>

          <Section title="Kualifikasi">
            <Field>
              <FieldLabel htmlFor="education" required>
                Pendidikan terakhir & jurusan
              </FieldLabel>
              <Input
                id="education"
                placeholder="Contoh: S1 Pendidikan Matematika"
                aria-invalid={errors.education ? true : undefined}
                aria-describedby={
                  errors.education ? "education-error" : undefined
                }
                {...register("education")}
              />
              {errors.education && (
                <FieldError id="education-error">
                  {errors.education.message}
                </FieldError>
              )}
            </Field>
            <CheckboxGroup
              control={control}
              name="subjects"
              title="Mata pelajaran *"
              options={TUTOR_SUBJECTS}
              error={errors.subjects?.message}
            />
            <CheckboxGroup
              control={control}
              name="levels"
              title="Jenjang *"
              options={LEVELS}
              error={errors.levels?.message}
            />
          </Section>
        </div>

        <div className="lg:gap-ns-2xl contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col">
          <Section title="Ketersediaan & lokasi">
            <CheckboxGroup
              control={control}
              name="days"
              title="Hari tersedia *"
              options={DAYS}
              error={errors.days?.message}
            />
            <div className="gap-ns-m grid grid-cols-2">
              <Controller
                control={control}
                name="from"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="from" required>
                      Jam mulai
                    </FieldLabel>
                    <TimePicker
                      id="from"
                      placeholder="Pilih jam"
                      start="07.00"
                      end="20.00"
                      value={field.value || null}
                      onValueChange={(v) => {
                        field.onChange(v ?? "")
                        field.onBlur()
                      }}
                      invalid={!!errors.from}
                    />
                    {errors.from && (
                      <FieldError>{errors.from.message}</FieldError>
                    )}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="until"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="until" required>
                      Jam selesai
                    </FieldLabel>
                    <TimePicker
                      id="until"
                      placeholder="Pilih jam"
                      start="08.30"
                      end="21.30"
                      value={field.value || null}
                      onValueChange={(v) => {
                        field.onChange(v ?? "")
                        field.onBlur()
                      }}
                      invalid={!!errors.until}
                    />
                    {errors.until && (
                      <FieldError>{errors.until.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>
            <Field>
              <FieldLabel htmlFor="address" required>
                Alamat domisili
              </FieldLabel>
              <Input
                id="address"
                placeholder="Masukkan alamat"
                autoComplete="street-address"
                aria-invalid={errors.address ? true : undefined}
                aria-describedby={
                  errors.address ? "address-error" : "address-help"
                }
                {...register("address")}
              />
              {errors.address ? (
                <FieldError id="address-error">
                  {errors.address.message}
                </FieldError>
              ) : (
                <FieldDescription id="address-help">
                  Dipakai untuk menghitung jarak ke siswa.
                </FieldDescription>
              )}
            </Field>
          </Section>

          <Section title="Honor">
            <Controller
              control={control}
              name="rate"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="rate" required>
                    Tarif per sesi
                  </FieldLabel>
                  <Input
                    id="rate"
                    ref={field.ref}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Contoh: Rp60.000"
                    value={field.value > 0 ? formatRupiah(field.value) : ""}
                    onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                    onBlur={field.onBlur}
                    aria-invalid={errors.rate ? true : undefined}
                    aria-describedby={errors.rate ? "rate-error" : "rate-help"}
                  />
                  {errors.rate ? (
                    <FieldError id="rate-error">
                      {errors.rate.message}
                    </FieldError>
                  ) : (
                    <FieldDescription id="rate-help">
                      Wajib diisi agar tutor ikut dalam rekap honor.
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          </Section>
        </div>
      </form>
    </DetailScreen>
  )
}

/* Judul bagian formulir (Body/Bold) dengan isian berjarak 16 */
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="gap-ns-l flex flex-col">
      <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

/* Grup checkbox 2 kolom (mapel, jenjang, hari) */
function CheckboxGroup({
  control,
  name,
  title,
  options,
  error,
}: {
  control: Control<TutorFormInput>
  name: Extract<FieldPath<TutorFormInput>, "subjects" | "levels" | "days">
  title: string
  options: readonly string[]
  error?: string
}) {
  const errorId = `${name}-error`
  return (
    <FormGroup
      title={<span className="text-subtitle">{title}</span>}
      aria-describedby={error ? errorId : undefined}
    >
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          /* Mobile: 2 kolom, baris 48px; desktop: satu baris berjajar */
          <div className="gap-x-ns-l lg:gap-x-ns-2xl grid grid-cols-2 *:min-h-12 lg:flex lg:flex-wrap lg:*:min-h-10">
            {options.map((option, i) => (
              <Checkbox
                key={option}
                label={option}
                ref={i === 0 ? field.ref : undefined}
                checked={field.value.includes(option)}
                aria-invalid={error ? true : undefined}
                onCheckedChange={(checked) => {
                  field.onChange(
                    checked
                      ? options.filter(
                          (o) => o === option || field.value.includes(o)
                        )
                      : field.value.filter((o) => o !== option)
                  )
                  field.onBlur()
                }}
              />
            ))}
          </div>
        )}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FormGroup>
  )
}

export { FormTutor }
