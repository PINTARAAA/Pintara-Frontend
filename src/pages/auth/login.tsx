import { useNavigate, useSearchParams } from "react-router"

import { AuthLayout } from "@/components"
import { LoginForm } from "@/features/auth"
import type { LoginNotice } from "@/types/auth"

/*
 * /masuk · Figma PINTARA → UI Screen → Umum → 00 · Autentikasi
 * ?alasan=sesi-berakhir | keluar menampilkan banner informasi.
 */
const NOTICES: LoginNotice[] = ["sesi-berakhir", "keluar"]

export default function LoginRoute() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reason = params.get("alasan")
  const notice = NOTICES.find((n) => n === reason)

  return (
    <AuthLayout
      title="Masuk ke akun Anda"
      description="Gunakan email atau username dan password yang terdaftar."
      note="Belum punya akun? Akun dibuat oleh Pengelola LBB setelah pendaftaran diverifikasi."
    >
      <LoginForm
        notice={notice}
        onSuccess={() => navigate("/", { replace: true })}
      />
    </AuthLayout>
  )
}
