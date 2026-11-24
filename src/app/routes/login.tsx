import { Link } from "react-router"

import { AuthLayout } from "@/components/layouts/auth-layout"
import { Button } from "@/components/ui/button"
import { ROLE_LABEL, type Role } from "@/app/navigation"

/*
 * SEMENTARA · halaman masuk.
 * Form login (Figma: Login / Default) dan autentikasi belum dibuat; tombol di
 * bawah hanya pintasan untuk melihat area tiap peran selama pengembangan.
 */
const roles: Role[] = ["wali", "tutor", "pengelola"]

export default function LoginRoute() {
  return (
    <AuthLayout
      title="Masuk ke akun Anda"
      description="Form login belum dibuat. Pilih peran untuk melihat tampilannya."
    >
      <div className="flex flex-col gap-ns-m">
        {roles.map((role) => (
          <Button
            key={role}
            variant="secondary"
            nativeButton={false}
            render={<Link to={`/${role}`} />}
          >
            Masuk sebagai {ROLE_LABEL[role]}
          </Button>
        ))}
      </div>
    </AuthLayout>
  )
}
