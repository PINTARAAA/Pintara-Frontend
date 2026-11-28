import { queryOptions } from "@tanstack/react-query"
import { format, getDay, isValid, parse, startOfDay } from "date-fns"

import { NotFoundError } from "@/features/jadwal/api/jadwal"
import { findLastHeldSession } from "@/features/presensi/api"
import { parseTime } from "@/lib/data/jadwal"
import { routines } from "@/lib/data/jadwal-tutor"
import { httpClient } from "@/lib/api"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { normalizePhone } from "@/lib/format"
import type {
  TutorRoutine,
  TutorSchedule,
  TutorScheduleDetail,
  TutorScheduleSession,
} from "@/types/jadwal"

/*
 * Jadwal tutor · Figma PINTARA → UI Screen → Tutor → T5 · Jadwal
 *
 * Sudah memakai BE: getTutorSchedule.
 *
 * TODO(backend):
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
    parent: {
      ...routine.parent,
      /* "0813-5566-7788" → "6281355667788" (nomor kanonis untuk wa.me) */
      whatsapp: normalizePhone(routine.parent.phone) ?? "",
    },
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
