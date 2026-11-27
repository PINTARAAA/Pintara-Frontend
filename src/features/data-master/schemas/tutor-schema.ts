import { z } from "zod"

import { isValidPhone } from "@/lib/format"

/*
 * Validasi formulir Tambah / Ubah Tutor · Figma "Data Tutor / Tambah tutor".
 */
const required = (message: string) => z.string().trim().min(1, message)
const minutes = (t: string) => {
  const [h, m] = t.split(".").map(Number)
  return h * 60 + m
}

export const tutorSchema = z
  .object({
    name: required("Nama lengkap wajib diisi."),
    phone: required("No. WhatsApp wajib diisi.").refine(
      isValidPhone,
      "Format No. WhatsApp tidak valid. Contoh: 0812-3456-7890"
    ),
    email: required("Email wajib diisi.").email(
      "Format email tidak valid. Contoh: nama@email.com"
    ),
    education: required("Pendidikan terakhir & jurusan wajib diisi."),
    subjects: z.array(z.string()).min(1, "Pilih minimal satu mata pelajaran."),
    levels: z.array(z.string()).min(1, "Pilih minimal satu jenjang."),
    days: z.array(z.string()).min(1, "Pilih minimal satu hari."),
    from: z.string().min(1, "Pilih jam mulai."),
    until: z.string().min(1, "Pilih jam selesai."),
    address: required("Alamat domisili wajib diisi."),
    rate: z
      .number({ error: "Tarif per sesi wajib diisi." })
      .min(1, "Tarif per sesi wajib diisi.")
      .max(1_000_000, "Tarif per sesi maksimal Rp1.000.000."),
  })
  .refine(
    (v) => !v.from || !v.until || minutes(v.until) - minutes(v.from) >= 90,
    {
      path: ["until"],
      message: "Jam selesai minimal 90 menit setelah jam mulai.",
    }
  )

export type TutorFormInput = z.infer<typeof tutorSchema>

export const EMPTY_TUTOR: TutorFormInput = {
  name: "",
  phone: "",
  email: "",
  education: "",
  subjects: [],
  levels: [],
  days: [],
  from: "",
  until: "",
  address: "",
  rate: 0,
}
