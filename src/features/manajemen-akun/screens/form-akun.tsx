import type * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useNavigate, useParams, useSearchParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  PhoneInput,
} from "@/components"
import {
  accountQuery,
  duplicateFieldOf,
  isNotFoundError,
  linkableStudentsQuery,
  ROLE_LABEL,
  saveAccount,
  usernameOf,
} from "@/features/manajemen-akun/api"
import type { AccountDetail, AccountRole } from "@/types/manajemen-akun"
import { getErrorMessage } from "@/lib/api"
import { formatPhone } from "@/lib/format"
import { cn } from "@/lib/styles"
import {
  akunSchema,
  type AkunFormInput,
} from "@/features/manajemen-akun/schemas"

/*
 * P10 · Tambah Akun / Ubah Data Akun · Figma "Manajemen Akun / Tambah akun".
 *
 * Peran (Wali Murid · Tutor · Pengelola LBB) → Data akun (nama, email,
 * username, WhatsApp) → [wali] Tautkan ke siswa (pilih banyak, opsional).
 * Password sementara dikirim ke email. Mode ubah (/akun/:id/ubah) memakai
 * formulir yang sama; peran tidak bisa diganti.
 */
const ROLES = Object.keys(ROLE_LABEL) as AccountRole[]

function FormAkun() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    ...accountQuery(accountId ?? ""),
    enabled: !!accountId,
  })

  if (!accountId) return <AkunForm />
  if (query.data) return <AkunForm account={query.data} />

  return (
    <DetailScreen
      title="Ubah Data Akun"
      backLabel="Detail Akun"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat akun…" />
      ) : isNotFoundError(query.error) ? (
        <DataState
          state="empty"
          title="Akun tidak ditemukan"
          description="Akun ini mungkin sudah dihapus atau tautannya keliru."
          action={{
            label: "Kembali ke Manajemen Akun",
            onClick: () => navigate("/pengelola/akun", { replace: true }),
          }}
        />
      ) : (
        <DataState
          state="error"
          title="Akun gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      )}
    </DetailScreen>
  )
}

function AkunForm({ account }: { account?: AccountDetail }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const roleParam = params.get("peran") as AccountRole | null

  const form = useForm<AkunFormInput>({
    resolver: zodResolver(akunSchema),
    mode: "onTouched",
    defaultValues: account
      ? {
          role: account.role,
          name: account.name,
          email: account.email,
          username: account.username,
          phone: formatPhone(account.phone),
          studentIds: account.studentIds,
        }
      : {
          role: roleParam && ROLES.includes(roleParam) ? roleParam : "wali",
          name: "",
          email: "",
          username: "",
          phone: "",
          studentIds: [],
        },
  })
  const { register, control, formState, setError, getValues, setValue } = form
  const { errors } = formState
  const role = useWatch({ control, name: "role" })
  const students = useQuery({
    ...linkableStudentsQuery(),
    enabled: role === "wali",
  })

  const save = useMutation({
    mutationFn: (values: AkunFormInput) => saveAccount(values, account?.id),
    networkMode: "always",
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["manajemen-akun"] })
      toast.success(account ? "Data akun diperbarui" : "Akun dibuat", {
        description: account
          ? undefined
          : `Password sementara dikirim ke ${saved.email}.`,
      })
      if (account) navigate(-1)
      else navigate(`/pengelola/akun/${saved.id}`, { replace: true })
    },
    onError: (error) => {
      const field = duplicateFieldOf(error)
      if (field) {
        setError(
          field,
          {
            message: `${field === "email" ? "Email" : "Username"} sudah dipakai akun lain.`,
          },
          { shouldFocus: true }
        )
      } else {
        toast.error("Akun gagal disimpan", {
          description: `${getErrorMessage(error)} Isian Anda tetap tersimpan.`,
        })
      }
    },
  })

  const submit = form.handleSubmit((values) => save.mutate(values))
  const nameField = register("name")

  return (
    <DetailScreen
      title={account ? "Ubah Data Akun" : "Tambah Akun"}
      backLabel={account ? "Detail Akun" : "Manajemen Akun"}
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
              : account
                ? "Simpan Perubahan"
                : "Buat Akun"}
          </Button>
        </>
      }
    >
      <form
        noValidate
        aria-label={account ? "Formulir ubah akun" : "Formulir tambah akun"}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        /*
         * Desktop (Figma "Manajemen Akun / Tambah akun (Desktop)"): dua
         * kolom (jarak 48). Peran, banner tutor, dan Tautkan ke siswa
         * mengisi kolom kiri (grid dense); Data akun di kolom kanan.
         */
        className="gap-ns-2xl flex flex-col lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:items-start lg:gap-x-12"
      >
        <fieldset className="gap-ns-m flex flex-col lg:col-start-1">
          <legend className="mb-ns-m text-body text-grayscale-text-title leading-normal font-bold">
            Peran <span aria-hidden="true">*</span>
          </legend>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(v) => field.onChange(v as AccountRole)}
                disabled={!!account}
                className="gap-0 *:min-h-12"
              >
                {ROLES.map((r, i) => (
                  <RadioGroupItem
                    key={r}
                    value={r}
                    label={ROLE_LABEL[r]}
                    ref={i === 0 ? field.ref : undefined}
                  />
                ))}
              </RadioGroup>
            )}
          />
          {account && (
            <FieldDescription>
              Peran tidak bisa diganti. Buat akun baru untuk peran lain.
            </FieldDescription>
          )}
        </fieldset>

        {role === "tutor" && !account && (
          <AlertBanner
            className="lg:col-start-1"
            status="info"
            title="Tutor baru sebaiknya ditambahkan dari Data Tutor"
            description="Di sana profil mengajar dan tarif honor ikut diisi, lalu akun login dibuat otomatis."
            action={{
              label: "Buka Data Tutor",
              onClick: () => navigate("/pengelola/tutor/tambah"),
            }}
          />
        )}

        <Section
          title="Data akun"
          className={cn(
            "lg:col-start-2 lg:row-start-1",
            /* Rentangkan ke baris kedua bila kolom kiri berisi dua bagian */
            (role === "wali" || (role === "tutor" && !account)) &&
              "lg:row-span-2"
          )}
        >
          <Field>
            <FieldLabel htmlFor="name" required>
              Nama lengkap
            </FieldLabel>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...nameField}
              onBlur={(e) => {
                void nameField.onBlur(e)
                /* Usulkan username dari nama bila masih kosong */
                if (!getValues("username") && e.target.value.trim()) {
                  setValue("username", usernameOf(e.target.value))
                }
              }}
            />
            {errors.name && (
              <FieldError id="name-error">{errors.name.message}</FieldError>
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
                {account
                  ? "Dipakai untuk login dan notifikasi."
                  : "Password sementara dikirim ke email ini."}
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="username" required>
              Username
            </FieldLabel>
            <Input
              id="username"
              autoComplete="off"
              autoCapitalize="none"
              placeholder="Contoh: sari.wulandari"
              aria-invalid={errors.username ? true : undefined}
              aria-describedby={errors.username ? "username-error" : undefined}
              {...register("username", {
                setValueAs: (v: string) => v.trim().toLowerCase(),
              })}
            />
            {errors.username && (
              <FieldError id="username-error">
                {errors.username.message}
              </FieldError>
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
        </Section>

        {role === "wali" && (
          <Section title="Tautkan ke siswa" className="lg:col-start-1">
            <Controller
              control={control}
              name="studentIds"
              render={({ field }) => {
                const items = (students.data ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.name} · Kelas ${s.grade}`,
                }))
                const nameOf = (id: string) =>
                  students.data?.find((s) => s.id === id)?.name ?? id
                return (
                  <Field>
                    <FieldLabel htmlFor="students">Siswa</FieldLabel>
                    <Select
                      multiple
                      items={items}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as string[])}
                      disabled={students.isPending}
                    >
                      <SelectTrigger
                        id="students"
                        aria-describedby="students-help"
                      >
                        <SelectValue>
                          {(value: string[]) =>
                            value.length === 0 ? (
                              <span className="text-grayscale-text-caption">
                                {students.isPending
                                  ? "Memuat siswa…"
                                  : "Pilih satu atau lebih siswa"}
                              </span>
                            ) : value.length <= 2 ? (
                              value.map(nameOf).join(", ")
                            ) : (
                              `${nameOf(value[0])} +${value.length - 1} siswa`
                            )
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <SelectGroup className="p-0">
                          {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription id="students-help">
                      Opsional. Bisa ditautkan nanti dari detail akun.
                    </FieldDescription>
                  </Field>
                )
              }}
            />
          </Section>
        )}
      </form>
    </DetailScreen>
  )
}

function Section({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("gap-ns-l flex flex-col", className)}>
      <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export { FormAkun }
