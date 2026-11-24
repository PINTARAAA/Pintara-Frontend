import { z } from "zod"

/* Validasi form masuk; pesan sesuai Figma "Login / Error - Field kosong" */
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email atau username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
})

export type LoginInput = z.infer<typeof loginSchema>
