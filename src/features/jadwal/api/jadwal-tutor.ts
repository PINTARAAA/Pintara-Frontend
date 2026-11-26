import { queryOptions } from "@tanstack/react-query"
import { addDays, format, getDay, isValid, parse, startOfDay } from "date-fns"

import { NotFoundError } from "@/features/jadwal/api/jadwal"
import { findLastHeldSession } from "@/features/presensi/api"
import { parseTime, WEEKDAYS } from "@/lib/data/jadwal"
import { routines, WEEK_COUNT } from "@/lib/data/jadwal-tutor"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type {
  TutorRoutine,
  TutorSchedule,
  TutorScheduleDetail,
  TutorScheduleSession,
} from "@/types/jadwal"

/*
 * Jadwal tutor · Figma PINTARA → UI Screen → Tutor → T5 · Jadwal
 *
 * TODO(backend):
 *   getTutorSchedule(minggu)    → httpClient.get("/tutor/jadwal", { params: { minggu } })
 *   getTutorScheduleSession(id) → httpClient.get(`/tutor/jadwal/${id}`)
 *
 * Selama backend belum ada (mode development) sesi dibentuk dari jadwal
 * rutin mingguan tutor di bawah.
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

/* "0813-5566-7788" → "6281355667788" (format wa.me) */
const toWhatsapp = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "62")

function weekRange(week: number, now = new Date()) {
  const from = addDays(startOfDay(now), week * 7)
  return { from, to: addDays(from, 6) }
}

/* Sesi terjadwal pada satu hari, urut jam (dipakai pengingat T7) */
export function tutorSessionsOn(date: Date) {
  return routines
    .filter((r) => r.weekday === getDay(date))
    .map((r) => toSession(r, date))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

/* ---------- Daftar per minggu ---------- */

export async function getTutorSchedule(week = 0): Promise<TutorSchedule> {
  assertMockAllowed()
  await delay()

  const active = Math.min(Math.max(Math.trunc(week) || 0, 0), WEEK_COUNT - 1)
  const weeks = Array.from({ length: WEEK_COUNT }, (_, i) => weekRange(i))
  const { from } = weeks[active]

  const allDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i)
    return { date, sessions: tutorSessionsOn(date) }
  })

  return {
    week: active,
    weeks,
    days: allDays.filter((d) => d.sessions.length > 0),
    freeDays: allDays
      .filter((d) => d.sessions.length === 0)
      .map((d) => WEEKDAYS[getDay(d.date)]),
  }
}

export const tutorScheduleQuery = (week = 0) =>
  queryOptions({
    queryKey: ["jadwal", "tutor", week],
    queryFn: () => getTutorSchedule(week),
  })

/* ---------- Detail sesi ---------- */

export async function getTutorScheduleSession(
  id: string
): Promise<TutorScheduleDetail> {
  assertMockAllowed()
  await delay(300)

  const [routineId, dateKey = ""] = id.split("_")
  const routine = routines.find((r) => r.id === routineId)
  const day = parse(dateKey, "yyyyMMdd", new Date())
  if (!routine || !isValid(day) || getDay(day) !== routine.weekday) {
    throw new NotFoundError("Jadwal")
  }

  const session = toSession(routine, day)
  const last = findLastHeldSession(routine.student.name, session.start)
  return {
    ...session,
    parent: { ...routine.parent, whatsapp: toWhatsapp(routine.parent.phone) },
    previous: last && {
      date: last.start,
      subject: last.subject,
      topic: last.record?.topic,
      notes: last.record?.notes || undefined,
    },
  }
}

export const tutorScheduleSessionQuery = (id: string) =>
  queryOptions({
    queryKey: ["jadwal", "tutor", "sesi", id],
    queryFn: () => getTutorScheduleSession(id),
  })
