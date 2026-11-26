import { queryOptions, useQuery } from "@tanstack/react-query"
import {
  format,
  isAfter,
  startOfDay,
  startOfMonth,
  subHours,
  subMonths,
} from "date-fns"
import { id as localeId } from "date-fns/locale"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api"
import { tutorSessionsOn } from "@/features/jadwal/api"
import type {
  AppNotification,
  NotificationList,
} from "@/features/notifikasi/api/notifikasi"
import { snapshotTutorSessions } from "@/features/presensi/api"
import { firstName } from "@/features/presensi/lib"
import { formatRupiah } from "@/lib/format/currency"

/*
 * Notifikasi Tutor · Figma PINTARA → UI Screen → Tutor → T7
 *
 * TODO(backend):
 *   getTutorNotifications() → httpClient.get("/tutor/notifikasi")
 *   markTutorRead(id)       → httpClient.post(`/tutor/notifikasi/${id}/dibaca`)
 *   markAllTutorRead()      → httpClient.post("/tutor/notifikasi/dibaca-semua")
 *
 * Selama backend belum ada (mode development):
 *   - "Isi presensi yang terlewat" & "Keberatan dari wali" dihitung dari
 *     data presensi (T2/T3), jadi hilang setelah presensi diisi;
 *   - "Pengingat jadwal" muncul 2 jam sebelum sesi hari ini (T5);
 *   - rekap & honor adalah contoh yang sudah dibaca.
 */
export type TutorNotificationKind =
  "presensi" | "keberatan" | "pengingat" | "rekap" | "honor"

export type TutorNotification = AppNotification<TutorNotificationKind>

const REMINDER_HOURS = 2

/* ID notifikasi yang sudah dibaca (contoh statis & turunan) */
const readIds = new Set<string>(["tn-rekap", "tn-honor"])

const longDay = (d: Date) => format(d, "EEEE d MMM", { locale: localeId })
const dayMonth = (d: Date) => format(d, "d MMM", { locale: localeId })
const monthName = (d: Date) => format(d, "MMMM", { locale: localeId })

function buildNotifications(now = new Date()): TutorNotification[] {
  const sessions = snapshotTutorSessions()
  const eightAm = at(0, 8)
  const morning = isAfter(now, eightAm) ? eightAm : subHours(now, 1)

  const missed = sessions
    .filter((s) => !s.record && s.start < startOfDay(now))
    .map<Omit<TutorNotification, "read">>((s) => ({
      id: `tn-presensi-${s.id}`,
      kind: "presensi",
      title: "Isi presensi yang terlewat",
      body: `${s.subject} · ${s.student.name} · ${longDay(s.start)}`,
      createdAt: morning,
      to: `/tutor/presensi/${s.id}`,
    }))

  const disputed = sessions
    .filter((s) => s.record?.validation === "keberatan")
    .map<Omit<TutorNotification, "read">>((s) => ({
      id: `tn-keberatan-${s.id}`,
      kind: "keberatan",
      title: "Keberatan dari wali",
      body: `${s.subject} · ${firstName(s.student.name)} · ${dayMonth(s.start)}`,
      status: "sedang ditinjau Pengelola",
      createdAt: s.record?.objection?.at ?? s.start,
      to: `/tutor/presensi/status/${s.id}`,
    }))

  /* Sesi hari ini yang belum selesai dan sudah masuk jendela pengingat */
  const reminders = tutorSessionsOn(now)
    .filter(
      (s) =>
        isAfter(s.end, now) && !isAfter(subHours(s.start, REMINDER_HOURS), now),
    )
    .map<Omit<TutorNotification, "read">>((s) => ({
      id: `tn-pengingat-${s.id}`,
      kind: "pengingat",
      title: "Pengingat jadwal",
      body: `${s.subject} · ${s.student.name} · hari ini ${format(s.start, "HH.mm")}`,
      createdAt: subHours(s.start, REMINDER_HOURS),
      to: `/tutor/jadwal/${s.id}`,
    }))

  const lastMonth = subMonths(now, 1)
  const examples: Omit<TutorNotification, "read">[] = [
    {
      id: "tn-rekap",
      kind: "rekap",
      title: "11 presensi terverifikasi final",
      body: `Masuk rekap honor ${monthName(now)}`,
      createdAt: at(-3, 19),
      to: "/tutor/presensi/status",
    },
    {
      id: "tn-honor",
      kind: "honor",
      title: `Honor ${monthName(lastMonth)} dibayar`,
      body: `${formatRupiah(780_000)} · tunai di LBB`,
      createdAt: new Date(startOfMonth(now).getTime() + 10 * 3_600_000),
      to: `/tutor/riwayat?bulan=${format(lastMonth, "yyyy-MM")}`,
    },
  ]

  return [...missed, ...disputed, ...reminders, ...examples]
    .map((n) => ({ ...n, read: readIds.has(n.id) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/* ---------- Query ---------- */

export async function getTutorNotifications(): Promise<
  NotificationList<TutorNotificationKind>
> {
  assertMockAllowed()
  await delay(300)
  const all = buildNotifications()
  return {
    unread: all.filter((n) => !n.read),
    read: all.filter((n) => n.read),
  }
}

export const tutorNotificationsQuery = () =>
  queryOptions({
    queryKey: ["notifikasi", "tutor"],
    queryFn: getTutorNotifications,
    /* Selalu ambil ulang: presensi yang diisi menghapus notifikasi terkait */
    staleTime: 0,
  })

/* Jumlah belum dibaca untuk titik merah lonceng di layar tab tutor */
export function useTutorUnreadNotifications() {
  return useQuery({
    ...tutorNotificationsQuery(),
    select: (d) => d.unread.length,
  }).data
}

/* ---------- Aksi ---------- */

export async function markTutorRead(id: string) {
  assertMockAllowed()
  readIds.add(id)
}

export async function markAllTutorRead() {
  assertMockAllowed()
  await delay(300)
  buildNotifications().forEach((n) => readIds.add(n.id))
}
