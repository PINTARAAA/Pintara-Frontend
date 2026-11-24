import { z } from "zod"

/*
 * Validasi "Jadwal Les / Ajukan perubahan" · pesan error mengikuti frame
 * "Jadwal Les / Error - Belum lengkap".
 */
export const REASON_MAX = 500

export const CHANGE_DAY_OPTIONS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const

export const scheduleChangeSchema = z.object({
  scope: z.string().min(1, "Pilih kapan perubahan berlaku."),
  day: z.string().min(1, "Pilih hari alternatif."),
  startTime: z.string().min(1, "Pilih jam mulai."),
  reason: z
    .string()
    .trim()
    .min(1, "Alasan perubahan wajib diisi.")
    .max(REASON_MAX, `Alasan maksimal ${REASON_MAX} karakter.`),
})

export type ScheduleChangeInput = z.infer<typeof scheduleChangeSchema>

/* Jadwal baru harus berbeda dari jadwal saat ini */
export function withCurrentSchedule(current: { day: string; startTime: string }) {
  return scheduleChangeSchema.superRefine((value, ctx) => {
    if (value.day === current.day && value.startTime === current.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["day"],
        message: "Pilih hari atau jam yang berbeda dari jadwal saat ini.",
      })
    }
  })
}
