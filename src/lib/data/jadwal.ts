import {
  addDays,
  getDay,
  isAfter,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns"

import { at } from "@/lib/data/mock"
import type { ChangeRequest, Routine, ScheduleTutor } from "@/types/jadwal"

/* Nama hari sesuai getDay() date-fns: 0 = Minggu */
export const WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const

/* ---------- Utilitas waktu "HH.mm" ---------- */

export function parseTime(time: string) {
  const [h, m] = time.split(/[.:]/).map(Number)
  return { hours: h, minutes: m }
}

/* "16.00" + 90 → "17.30" */
export function addMinutesToTime(time: string, minutes: number) {
  const { hours, minutes: m } = parseTime(time)
  const total = hours * 60 + m + minutes
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(Math.floor(total / 60) % 24)}.${pad(total % 60)}`
}

/* "16.00–17.30" */
export const formatTimeSlot = (startTime: string, durationMinutes: number) =>
  `${startTime}–${addMinutesToTime(startTime, durationMinutes)}`

function withTime(day: Date, time: string) {
  const { hours, minutes } = parseTime(time)
  return setMinutes(setHours(startOfDay(day), hours), minutes)
}

/* Sesi berikutnya dari jadwal rutin (hari ini dihitung bila belum dimulai) */
export function nextSessionStart(
  weekday: number,
  startTime: string,
  now = new Date()
) {
  const offset = (weekday - getDay(now) + 7) % 7
  const candidate = withTime(addDays(now, offset), startTime)
  return isAfter(candidate, now) ? candidate : addDays(candidate, 7)
}

/* ---------- Data contoh ---------- */

const BUDI: ScheduleTutor = { name: "Kak Budi Santoso", shortName: "Kak Budi" }
const NADIA: ScheduleTutor = { name: "Kak Nadia Safitri", shortName: "Kak Nadia" }

export const routines: Routine[] = [
  {
    id: "rut-mtk-s1",
    studentId: "s1",
    subject: "Matematika",
    weekday: 3,
    startTime: "16.00",
    durationMinutes: 90,
    tutor: BUDI,
    location: "Jl. Trunojoyo No. 12, Bangkalan",
    since: at(-19, 0),
  },
  {
    id: "rut-ipa-s1",
    studentId: "s1",
    subject: "IPA",
    weekday: 5,
    startTime: "16.00",
    durationMinutes: 90,
    tutor: BUDI,
    location: "Jl. Trunojoyo No. 12, Bangkalan",
    since: at(-17, 0),
  },
  {
    id: "rut-bing-s2",
    studentId: "s2",
    subject: "Bahasa Inggris",
    weekday: 4,
    startTime: "15.00",
    durationMinutes: 90,
    tutor: NADIA,
    location: "Jl. Trunojoyo No. 12, Bangkalan",
    since: at(-30, 0),
  },
]

/* Contoh: Ibu Sari mengajukan pindah les Matematika Aisyah (ditinjau di P5) */
export const changeRequests: ChangeRequest[] = [
  {
    id: "pj-contoh-aisyah",
    routineId: "rut-mtk-s1",
    studentId: "s1",
    subject: "Matematika",
    tutor: BUDI,
    durationMinutes: 90,
    from: { weekday: 3, startTime: "16.00" },
    to: { weekday: 4, startTime: "16.00" },
    scope: "seterusnya",
    effectiveDate: addDays(nextSessionStart(3, "16.00"), 7),
    reason: "Mulai Desember Aisyah ikut ekstrakurikuler pramuka setiap Rabu sore.",
    status: "ditinjau_pengelola",
    submittedAt: at(-1, 12, 40),
  },
]

export const OPEN_STATUSES: ChangeRequest["status"][] = [
  "ditinjau_pengelola",
  "konfirmasi_tutor",
]
