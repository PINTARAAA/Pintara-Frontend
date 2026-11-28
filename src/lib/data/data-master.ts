import type { Level } from "@/types/data-master"

export const TUTOR_SUBJECTS = [
  "Matematika",
  "IPA",
  "Fisika",
  "Bahasa Inggris",
] as const
export const LEVELS: Level[] = ["SD", "SMP", "SMA"]
export const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const
export const DISTRICTS = [
  "Arosbaya",
  "Bangkalan",
  "Burneh",
  "Kamal",
  "Socah",
] as const
/* Radius layanan tutor dari domisilinya */
export const SERVICE_RADIUS_KM = 5

export const LEVEL_GRADES: Record<Level, string> = {
  SD: "kelas 1–6",
  SMP: "kelas 7–9",
  SMA: "kelas 10–12",
}

/* Mata pelajaran untuk filter daftar siswa (gabungan semua mapel) */
export const STUDENT_SUBJECTS = TUTOR_SUBJECTS
