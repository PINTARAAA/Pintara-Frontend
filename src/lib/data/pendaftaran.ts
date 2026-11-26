import { nextWednesday, setHours, startOfDay } from "date-fns"

import { at } from "@/lib/data/mock"
import type { LbbContact, Registration } from "@/types/pendaftaran"

/* ---------- Data contoh ---------- */

/* Data wali dari akun, untuk mengisi awal langkah 1 */
export const PENDAFTARAN_DEFAULTS = {
  parentName: "Sari Wulandari",
  parentPhone: "0812-3456-7890",
}

export const LBB_CONTACT: LbbContact = {
  name: "Pengelola LBB Jelajah Ilmu",
  whatsapp: "6281234567890",
}

export const registrations: Registration[] = [
  {
    id: "reg-fikri",
    number: "REG-2026-0098",
    studentName: "Fikri Ramadhan",
    grade: "5 SD",
    subjects: ["Bahasa Inggris"],
    days: ["Selasa", "Kamis"],
    startTime: "15.00",
    stage: "pencocokan_tutor",
    submittedAt: at(-3, 9, 20),
    verifiedAt: at(-2, 13, 5),
  },
]

/* Contoh sesuai frame Figma W3 (siswa Aisyah Putri) */
export function figmaExample(stage: string): Registration | null {
  const base: Registration = {
    id: "contoh",
    number: "REG-2026-0112",
    studentName: "Aisyah Putri",
    grade: "8 SMP",
    subjects: ["Matematika", "IPA"],
    days: ["Rabu", "Jumat"],
    startTime: "16.00",
    stage: "menunggu_verifikasi",
    submittedAt: at(-4, 10, 15),
  }
  switch (stage) {
    case "menunggu":
      return base
    case "pencocokan":
      return { ...base, stage: "pencocokan_tutor", verifiedAt: at(-3, 9) }
    case "selesai":
      return {
        ...base,
        stage: "selesai",
        verifiedAt: at(-3, 9),
        match: { tutorName: "Kak Budi Santoso", matchedAt: at(-1, 14, 30) },
        /* Rabu berikutnya pukul 16.00, sesuai jadwal yang diminta */
        firstSession: {
          start: setHours(startOfDay(nextWednesday(new Date())), 16),
          confirmedAt: at(0, 8),
        },
      }
    case "ditolak":
      return {
        ...base,
        stage: "ditolak",
        rejection: {
          reason:
            "Alamat les berada di luar jangkauan layanan tutor LBB Jelajah Ilmu.",
          rejectedAt: at(-3, 9),
        },
      }
    default:
      return null
  }
}
