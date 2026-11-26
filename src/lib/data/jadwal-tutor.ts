import type { TutorRoutine } from "@/types/jadwal"

/* Banyak minggu yang bisa dipilih: minggu ini + 3 minggu ke depan */
export const WEEK_COUNT = 4

/* ---------- Data contoh ---------- */

const RIZKY = { name: "Rizky Ananda", grade: "Kelas 10 SMA" }
const AISYAH = { name: "Aisyah Putri", grade: "Kelas 8 SMP" }
const DIMAS = { name: "Dimas Pratama", grade: "Kelas 9 SMP" }

const RIZKY_HOME = "Jl. Soekarno-Hatta No. 45, Bangkalan"
const AISYAH_HOME = "Jl. Trunojoyo No. 12, Bangkalan"
const DIMAS_HOME = "Perum Kraton Indah B-3, Bangkalan"

const RIZKY_PARENT = { name: "Dewi Ananda", phone: "0813-5566-7788" }
const AISYAH_PARENT = { name: "Sari Wulandari", phone: "0812-3456-7890" }
const DIMAS_PARENT = { name: "Arif Pratama", phone: "0857-1122-3344" }

export const routines: TutorRoutine[] = [
  {
    id: "tr-ipa-rizky",
    subject: "IPA",
    weekday: 2,
    startTime: "18.30",
    durationMinutes: 90,
    student: RIZKY,
    address: RIZKY_HOME,
    parent: RIZKY_PARENT,
  },
  {
    id: "tr-mtk-aisyah",
    subject: "Matematika",
    weekday: 3,
    startTime: "16.00",
    durationMinutes: 90,
    student: AISYAH,
    address: AISYAH_HOME,
    parent: AISYAH_PARENT,
  },
  {
    id: "tr-ipa-aisyah",
    subject: "IPA",
    weekday: 5,
    startTime: "16.00",
    durationMinutes: 90,
    student: AISYAH,
    address: AISYAH_HOME,
    parent: AISYAH_PARENT,
  },
  {
    id: "tr-mtk-rizky",
    subject: "Matematika",
    weekday: 6,
    startTime: "18.30",
    durationMinutes: 90,
    student: RIZKY,
    address: RIZKY_HOME,
    parent: RIZKY_PARENT,
  },
  {
    id: "tr-ipa-dimas",
    subject: "IPA",
    weekday: 1,
    startTime: "16.00",
    durationMinutes: 90,
    student: DIMAS,
    address: DIMAS_HOME,
    parent: DIMAS_PARENT,
  },
]
