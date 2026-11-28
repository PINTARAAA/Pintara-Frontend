import { queryOptions } from "@tanstack/react-query"
import { format, getDay, startOfDay } from "date-fns"

import { parseTime } from "@/lib/data/jadwal"
import { routines } from "@/lib/data/jadwal-tutor"
import { httpClient } from "@/lib/api"
import type {
  TutorRoutine,
  TutorSchedule,
  TutorScheduleDetail,
  TutorScheduleSession,
} from "@/types/jadwal"

/*
 * Jadwal tutor · Figma PINTARA → UI Screen → Tutor → T5 · Jadwal
 *
 * Sudah memakai BE: getTutorSchedule, getTutorScheduleSession.
 * `tutorSessionsOn` (data mock `@/lib/data/jadwal-tutor`) masih dibaca mock
 * pengingat notifikasi tutor sampai branch integrasinya.
 */

/* ---------- Utilitas ---------- */

/* ID sesi = jadwal rutin + tanggal, mis. "tr-ipa-rizky_20261124" */
const sessionId = (routineId: string, day: Date) =>
  `${routineId}_${format(day, "yyyyMMdd")}`

function toSession(routine: TutorRoutine, day: Date): TutorScheduleSession {
  const { hours, minutes } = parseTime(routine.startTime)
  const start = new Date(startOfDay(day))
  start.setHours(hours, minutes)
  return {
    id: sessionId(routine.id, day),
    routineId: routine.id,
    subject: routine.subject,
    start,
    end: new Date(start.getTime() + routine.durationMinutes * 60_000),
    student: routine.student,
    address: routine.address,
    shortAddress: routine.address.split(",")[0],
  }
}


/* Sesi terjadwal pada satu hari, urut jam (dipakai pengingat T7) */
export function tutorSessionsOn(date: Date) {
  return routines
    .filter((r) => r.weekday === getDay(date))
    .map((r) => toSession(r, date))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

/* ---------- Daftar per minggu ---------- */

/* 4 minggu ke depan (0 = minggu ini); hari kosong dikirim di freeDays */
export async function getTutorSchedule(week = 0): Promise<TutorSchedule> {
  const { data } = await httpClient.get<TutorSchedule>("/tutor/jadwal", {
    params: { minggu: week },
  })
  return data
}

export const tutorScheduleQuery = (week = 0) =>
  queryOptions({
    queryKey: ["jadwal", "tutor", week],
    queryFn: () => getTutorSchedule(week),
  })

/* ---------- Detail sesi ---------- */

/* 404 bila sesi tidak ada atau bukan milik tutor ini */
export async function getTutorScheduleSession(
  id: string
): Promise<TutorScheduleDetail> {
  const { data } = await httpClient.get<TutorScheduleDetail>(
    `/tutor/jadwal/${encodeURIComponent(id)}`
  )
  return data
}

export const tutorScheduleSessionQuery = (id: string) =>
  queryOptions({
    queryKey: ["jadwal", "tutor", "sesi", id],
    queryFn: () => getTutorScheduleSession(id),
  })
