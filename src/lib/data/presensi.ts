import {
  previousFriday,
  previousMonday,
  previousSaturday,
  previousThursday,
  previousTuesday,
  previousWednesday,
  setHours,
  setMinutes,
  startOfDay,
  subWeeks,
} from "date-fns"

import { at } from "@/lib/data/mock"
import type { TutorSession } from "@/types/presensi"

/* ---------- Data contoh ---------- */

function slot(day: Date, hour: number, minute = 0, minutes = 90) {
  const start = setMinutes(setHours(startOfDay(day), hour), minute)
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const today = new Date()
const AISYAH = { name: "Aisyah Putri", parentName: "Sari Wulandari", parentSalutation: "Ibu" }
const DIMAS = { name: "Dimas Pratama", parentName: "Arif Pratama", parentSalutation: "Bapak" }
const RIZKY = { name: "Rizky Ananda", parentName: "Dewi Ananda", parentSalutation: "Ibu" }

/* Presensi yang sudah divalidasi wali (sesi lampau) */
function verified(
  id: string,
  subject: string,
  student: typeof AISYAH,
  day: Date,
  topic: string
): TutorSession {
  const time = slot(day, 16)
  return {
    id,
    subject,
    student,
    ...time,
    record: {
      held: true,
      actualStart: "16.00",
      actualEnd: "17.30",
      studentPresent: true,
      topic,
      submittedAt: new Date(time.end.getTime() + 10 * 60_000),
      validation: "sudah_divalidasi",
      validatedAt: new Date(time.end.getTime() + 3 * 3_600_000),
    },
  }
}

export const sessions: TutorSession[] = [
  {
    id: "ts-dimas-1",
    subject: "IPA",
    student: DIMAS,
    ...slot(at(-1, 0), 16),
    record: null,
  },
  {
    id: "ts-rizky-1",
    subject: "IPA",
    student: RIZKY,
    /* Sama dengan "Les berikutnya" di Beranda tutor */
    ...slot(today.getHours() < 17 ? today : at(1, 0), today.getHours() < 17 ? 18 : 16, today.getHours() < 17 ? 30 : 0),
    record: null,
  },
  {
    id: "ts-aisyah-ipa",
    subject: "IPA",
    student: AISYAH,
    ...slot(previousFriday(today), 16),
    record: {
      held: true,
      actualStart: "16.00",
      actualEnd: "17.30",
      studentPresent: true,
      topic: "Sistem pencernaan manusia",
      attachment: { name: "foto_sesi_ipa.jpg", size: 1_200_000 },
      submittedAt: slot(previousFriday(today), 17, 45).start,
      validation: "belum_divalidasi",
    },
  },
  {
    id: "ts-rizky-mtk",
    subject: "Matematika",
    student: RIZKY,
    ...slot(previousSaturday(today), 9),
    record: {
      held: true,
      actualStart: "09.00",
      actualEnd: "10.30",
      studentPresent: true,
      topic: "Fungsi kuadrat",
      notes: "Lanjut latihan grafik fungsi",
      submittedAt: slot(previousSaturday(today), 10, 5).start,
      validation: "belum_divalidasi",
    },
  },
  {
    id: "ts-aisyah-mtk",
    subject: "Matematika",
    student: AISYAH,
    ...slot(previousWednesday(today), 16),
    record: {
      held: true,
      actualStart: "16.00",
      actualEnd: "17.30",
      studentPresent: true,
      topic: "Persamaan linear satu variabel",
      submittedAt: slot(previousWednesday(today), 17, 40).start,
      validation: "keberatan",
      objection: {
        reason: "Les hanya berlangsung 45 menit, bukan 90 menit seperti yang tercatat.",
        at: slot(previousWednesday(today), 20, 15).start,
      },
    },
  },
  verified("ts-v1", "IPA", RIZKY, previousMonday(today), "Hukum Newton"),
  verified("ts-v2", "Matematika", DIMAS, previousThursday(today), "Statistika dasar"),
  verified("ts-v3", "IPA", AISYAH, subWeeks(previousFriday(today), 1), "Sistem peredaran darah"),
  verified("ts-v4", "Matematika", AISYAH, subWeeks(previousWednesday(today), 1), "Bentuk aljabar"),
  verified("ts-v5", "IPA", DIMAS, subWeeks(previousMonday(today), 1), "Tekanan zat"),
  verified("ts-v6", "IPA", RIZKY, subWeeks(previousTuesday(today), 1), "Gerak lurus"),
  verified("ts-v7", "Matematika", DIMAS, subWeeks(previousThursday(today), 1), "Peluang"),
  verified("ts-v8", "Matematika", AISYAH, subWeeks(previousWednesday(today), 2), "Bilangan berpangkat"),
  verified("ts-v9", "IPA", DIMAS, subWeeks(previousMonday(today), 2), "Getaran"),
  verified("ts-v10", "IPA", RIZKY, subWeeks(previousTuesday(today), 2), "Besaran dan satuan"),
  verified("ts-v11", "Matematika", DIMAS, subWeeks(previousThursday(today), 2), "Himpunan"),
  verified("ts-v12", "IPA", AISYAH, subWeeks(previousFriday(today), 3), "Klasifikasi makhluk hidup"),
]
