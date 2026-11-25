import { z } from "zod"

/*
 * Validasi formulir Tambah / Ubah Akun · Figma "Manajemen Akun / Tambah akun".
 */
const required = (message: string) => z.string().trim().min(1, message)

export const akunSchema = z.object({
  role: z.enum(["wali", "tutor", "pengelola"], { error: "Pilih peran akun." }),
  name: required("Nama lengkap wajib diisi."),
  email: required("Email wajib diisi.").email(
    "Format email tidak valid. Contoh: nama@email.com"
  ),
  username: required("Username wajib diisi.").regex(
    /^[a-z0-9._]{4,30}$/,
    "Username 4–30 karakter: huruf kecil, angka, titik, atau garis bawah."
  ),
  phone: required("No. WhatsApp wajib diisi.").regex(
    /^(\+62|62|0)8[\d\s-]{7,14}$/,
    "Format No. WhatsApp tidak valid. Contoh: 0812xxxxxxxx"
  ),
  studentIds: z.array(z.string()),
})

export type AkunFormInput = z.infer<typeof akunSchema>
