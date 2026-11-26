import { queryOptions } from "@tanstack/react-query"
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns"

import {
  DAYS,
  lessonDirectory,
  studentDirectory,
  tutorDirectory,
} from "@/lib/data/data-master"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import { TOPICS } from "@/lib/data/rekap-les"
import type {
  LessonRecap,
  RecapFilter,
  RecapSession,
  SessionStatus,
} from "@/types/rekap-les"

/*
 * Rekap & Riwayat Les · Figma PINTARA → UI Screen → Pengelola LBB →
 * P11 · Rekap & Riwayat Les
 *
 * TODO(backend):
 *   getLessonRecap({ bulan, tutorId, siswaId }) →
 *     httpClient.get("/pengelola/riwayat-les", { params: { bulan, tutorId, siswaId } })
 *
 * Sesi dibentuk dari jadwal rutin (Data Siswa · Les aktif) per minggu sampai
 * hari ini. Status mengikuti alur presensi: belum dikumpulkan → belum
 * divalidasi wali → sudah divalidasi / keberatan; atau tidak terlaksana.
 */

/* Angka semu deterministik dari teks agar data contoh stabil tiap muat ulang */
const hash = (text: string) =>
  [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

function buildMonth(month: Date): RecapSession[] {
  const today = startOfDay(new Date())
  const last = endOfMonth(month)
  const sessions: RecapSession[] = []
  for (const lesson of lessonDirectory()) {
    const weekday = DAYS.indexOf(lesson.day as (typeof DAYS)[number]) + 1 // Senin = 1
    for (let d = startOfMonth(month); !isAfter(d, last); d = addDays(d, 1)) {
      if (d.getDay() !== weekday || isAfter(d, today)) continue
      const key = `${lesson.studentId}-${lesson.subject}-${format(d, "yyyy-MM-dd")}`
      const h = hash(key)
      const age = differenceInCalendarDays(today, d)
      const status: SessionStatus =
        h % 29 === 0
          ? "tidak_terlaksana"
          : age <= 3 && h % 3 === 0
            ? "belum_dikumpulkan"
            : age <= 7
              ? h % 11 === 0
                ? "keberatan"
                : "belum_divalidasi"
              : h % 23 === 0
                ? "keberatan"
                : "sudah_divalidasi"
      const topics = TOPICS[lesson.subject] ?? ["Latihan soal"]
      sessions.push({
        id: key,
        date: d,
        subject: lesson.subject,
        topic:
          status === "belum_dikumpulkan" || status === "tidak_terlaksana"
            ? null
            : topics[h % topics.length],
        tutorId: lesson.tutorId,
        tutorName: lesson.tutorName,
        studentId: lesson.studentId,
        studentName: lesson.studentName,
        status,
      })
    }
  }
  return sessions
}

/* ---------- Rekap ---------- */

const held = (s: RecapSession) => s.status !== "tidak_terlaksana"

export async function getLessonRecap(filter: RecapFilter = {}): Promise<LessonRecap> {
  assertMockAllowed()
  await delay()
  const current = startOfMonth(new Date())
  const month = startOfMonth(filter.month ?? current)
  const sessions = buildMonth(month).filter(
    (s) =>
      (!filter.tutorId || s.tutorId === filter.tutorId) &&
      (!filter.studentId || s.studentId === filter.studentId)
  )

  const group = <K extends "tutorId" | "studentId">(key: K) => {
    const map = new Map<string, RecapSession[]>()
    for (const s of sessions) map.set(s[key], [...(map.get(s[key]) ?? []), s])
    return [...map.values()]
  }
  const bySessions = <T extends { sessions: number; name: string }>(a: T, b: T) =>
    b.sessions - a.sessions || a.name.localeCompare(b.name)

  /* Pilihan filter: semua tutor/siswa aktif (bukan hanya yang punya sesi) */
  const options = (list: { id: string; name: string; status: string }[]) =>
    list
      .filter((x) => x.status === "aktif")
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))

  return {
    months: [current, subMonths(current, 1)],
    month,
    tutorOptions: options(tutorDirectory()),
    studentOptions: options(studentDirectory()),
    held: sessions.filter(held).length,
    missed: sessions.filter((s) => !held(s)).length,
    pairs: new Set(sessions.map((s) => `${s.tutorId}|${s.studentId}`)).size,
    byTutor: group("tutorId")
      .map((list) => ({
        id: list[0].tutorId,
        name: list[0].tutorName,
        sessions: list.filter(held).length,
        missed: list.filter((s) => !held(s)).length,
        students: new Set(list.map((s) => s.studentId)).size,
      }))
      .sort(bySessions),
    byStudent: group("studentId")
      .map((list) => ({
        id: list[0].studentId,
        name: list[0].studentName,
        sessions: list.filter(held).length,
        missed: list.filter((s) => !held(s)).length,
        tutors: [...new Set(list.map((s) => s.tutorName))],
      }))
      .sort(bySessions),
    sessions: sessions.sort(
      (a, b) => b.date.getTime() - a.date.getTime() || a.studentName.localeCompare(b.studentName)
    ),
  }
}

export const lessonRecapQuery = (filter: RecapFilter) =>
  queryOptions({
    queryKey: [
      "rekap-les",
      filter.month ? format(filter.month, "yyyy-MM") : "now",
      filter.tutorId ?? "",
      filter.studentId ?? "",
    ],
    queryFn: () => getLessonRecap(filter),
  })
