import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { AlertBanner } from "@/components/ui/alert-banner"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { login, LoginError, type LoginErrorCode } from "@/features/auth/api/login"
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/login-schema"
import type { AuthUser, LoginNotice } from "@/features/auth/types"

/*
 * Form masuk · Figma PINTARA → UI Screen → Umum → 00 · Autentikasi
 *
 * State yang didukung (sama dengan frame Figma):
 *   Default · Error - Field kosong · Error - Kredensial salah ·
 *   Error - Akun nonaktif · Info - Sesi berakhir · Info - Berhasil keluar
 * Banner tampil di antara judul halaman dan isian.
 */
const BANNERS = {
  invalid_credentials: {
    status: "error",
    title: "Email/username atau password salah",
    description: "Periksa kembali data Anda, lalu coba masuk lagi.",
  },
  account_inactive: {
    status: "warning",
    title: "Akun Anda tidak aktif",
    description: "Hubungi Pengelola LBB untuk mengaktifkan kembali akun Anda.",
  },
  "sesi-berakhir": {
    status: "info",
    title: "Sesi Anda telah berakhir",
    description: "Demi keamanan, silakan masuk kembali untuk melanjutkan.",
  },
  keluar: {
    status: "success",
    title: "Anda telah keluar",
    description: "Sampai jumpa lagi. Masuk kembali kapan saja untuk memantau les.",
  },
} as const satisfies Record<
  LoginErrorCode | LoginNotice,
  {
    status: "error" | "warning" | "info" | "success"
    title: string
    description: string
  }
>

function LoginForm({
  notice,
  onSuccess,
}: {
  /* Pesan informasi dari halaman sebelumnya (sesi berakhir / keluar) */
  notice?: LoginNotice
  onSuccess: (user: AuthUser) => void
}) {
  const [banner, setBanner] = React.useState<keyof typeof BANNERS | null>(
    notice ?? null
  )
  const [failure, setFailure] = React.useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null)
    try {
      const user = await login(values)
      onSuccess(user)
    } catch (error) {
      if (error instanceof LoginError) {
        setBanner(error.code)
      } else {
        setBanner(null)
        setFailure(
          error instanceof Error ? error.message : "Terjadi kendala. Coba lagi."
        )
      }
    }
  })

  const shownBanner = banner ? BANNERS[banner] : null

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-ns-2xl">
      {shownBanner && (
        <AlertBanner
          status={shownBanner.status}
          title={shownBanner.title}
          description={shownBanner.description}
        />
      )}
      {failure && <AlertBanner status="error" title={failure} />}

      <div className="flex flex-col gap-ns-l">
        <Field>
          <FieldLabel htmlFor="login-identifier">Email atau Username</FieldLabel>
          <Input
            id="login-identifier"
            autoComplete="username"
            placeholder="Masukkan email atau username"
            aria-invalid={errors.identifier ? true : undefined}
            aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
            {...form.register("identifier")}
          />
          {errors.identifier && (
            <FieldError id="login-identifier-error">
              {errors.identifier.message}
            </FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...form.register("password")}
          />
          {errors.password && (
            <FieldError id="login-password-error">
              {errors.password.message}
            </FieldError>
          )}
        </Field>

        <p className="text-caption text-grayscale-text-caption">
          Lupa password?{" "}
          <span className="font-bold text-primary-text-primary">
            Hubungi Pengelola LBB
          </span>
        </p>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  )
}

export { LoginForm }
