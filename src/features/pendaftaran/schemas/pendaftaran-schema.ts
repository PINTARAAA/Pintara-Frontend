import { z } from "zod"

import { isValidPhone } from "@/lib/format"

/*
 * Validasi form pendaftaran siswa · Figma PINTARA → UI Screen → Wali Murid →
 * W2 · Pendaftaran Siswa. Pesan error mengikuti frame
 * "Pendaftaran / Error - Field wajib kosong".
 */
export const GRADE_OPTIONS = [
  ...[1, 2, 3, 4, 5, 6].map((n) => `${n} SD`),
  ...[7, 8, 9].map((n) => `${n} SMP`),
  ...[10, 11, 12].map((n) => `${n} SMA`),
] as const

export const SUBJECT_OPTIONS = [
  "Matematika",
  "IPA",
  "Bahasa Inggris",
  "Bahasa Indonesia",
  "IPS",
] as const

export const FREQUENCY_OPTIONS = [
  { value: "1", label: "1× per minggu" },
  { value: "2", label: "2× per minggu" },
  { value: "3", label: "3× per minggu" },
] as const

export const DAY_OPTIONS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const

/* Durasi standar satu sesi les (menit) */
export const SESSION_MINUTES = 90

const required = (message: string) => z.string().trim().min(1, message)

export const pendaftaranSchema = z
  .object({
    /* Langkah 1 · Data Wali & Siswa */
    parentName: required("Nama wali wajib diisi."),
    parentPhone: required("No. WhatsApp wali wajib diisi.").refine(
      isValidPhone,
      "Format No. WhatsApp tidak valid. Contoh: 0812-3456-7890"
    ),
    studentName: required("Nama lengkap siswa wajib diisi."),
    grade: z.string().min(1, "Pilih kelas siswa."),
    school: required("Nama sekolah wajib diisi."),
    address: required("Alamat les wajib diisi."),

    /* Langkah 2 · Kebutuhan Belajar */
    subjects: z.array(z.string()).min(1, "Pilih minimal satu mata pelajaran."),
    frequency: z.string().min(1, "Pilih frekuensi les."),
    notes: z.string().trim().max(200, "Catatan maksimal 200 karakter."),

    /* Langkah 3 · Jadwal Belajar */
    days: z.array(z.string()),
    startTime: z.string().min(1, "Pilih jam mulai."),
  })
  .superRefine(
    (value, ctx) => {
      const needed = Number(value.frequency) || 1
      if (value.days.length < needed) {
        ctx.addIssue({
          code: "custom",
          path: ["days"],
          message: `Pilih minimal ${needed} hari sesuai frekuensi les.`,
        })
      }
    },
    /* Tetap dijalankan walau field lain belum valid (validasi per langkah) */
    { when: () => true }
  )

export type PendaftaranInput = z.infer<typeof pendaftaranSchema>

/* Field yang divalidasi saat menekan "Lanjut" pada tiap langkah */
export const STEP_FIELDS = [
  ["parentName", "parentPhone", "studentName", "grade", "school", "address"],
  ["subjects", "frequency", "notes"],
  ["days", "startTime"],
  [],
] as const satisfies readonly (readonly (keyof PendaftaranInput)[])[]

export const EMPTY_PENDAFTARAN: PendaftaranInput = {
  parentName: "",
  parentPhone: "",
  studentName: "",
  grade: "",
  school: "",
  address: "",
  subjects: [],
  frequency: "",
  notes: "",
  days: [],
  startTime: "",
}
