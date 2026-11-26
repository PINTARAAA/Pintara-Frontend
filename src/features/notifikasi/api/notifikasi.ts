import { queryOptions, useQuery } from "@tanstack/react-query"
import { format, subHours } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { getAttendance } from "@/features/absensi/api"
import { assertMockAllowed, at, delay } from "@/features/dashboard/api"

/*
 * Notifikasi Wali Murid · Figma PINTARA → UI Screen → Wali Murid → W9
 *
 * TODO(backend):
 *   getNotifications()  → httpClient.get("/wali/notifikasi")
 *   markRead(id)        → httpClient.post(`/wali/notifikasi/${id}/dibaca`)
 *   markAllRead()       → httpClient.post("/wali/notifikasi/dibaca-semua")
 *
 * Selama backend belum ada (mode development) data disimpan di memori.
 * Notifikasi "sesi perlu divalidasi" dihitung dari data absensi (W5), dan
 * fitur lain menambah notifikasi lewat addNotification() (mis. pengajuan
 * perubahan jadwal terkirim, pembayaran berhasil).
 */
export type NotificationKind =
  | "validasi"
  | "tagihan"
  | "jadwal"
  | "pembayaran"
  | "les"

export type AppNotification<Kind extends string = NotificationKind> = {
  id: string
  kind: Kind
  title: string
  body: string
  createdAt: Date
  read: boolean
  /* Tujuan saat notifikasi diketuk */
  to: string
  /* Keterangan pengganti waktu, mis. "sedang ditinjau Pengelola" */
  status?: string
}

/* ---------- Data contoh ---------- */

const now = new Date()
const eightAm = at(0, 8)

const store: AppNotification[] = [
  {
    id: "ntf-tagihan-nov",
    kind: "tagihan",
    title: `Tagihan ${format(at(-14, 0), "MMMM", { locale: localeId })} lewat jatuh tempo`,
    body: "Sisa Rp150.000",
    createdAt: eightAm < now ? eightAm : subHours(now, 1),
    read: false,
    to: "/wali/tagihan/inv-nov",
  },
  {
    id: "ntf-bayar-okt",
    kind: "pembayaran",
    title: "Pembayaran berhasil",
    body: `Tagihan ${format(at(-45, 0), "MMMM", { locale: localeId })} Rp450.000`,
    createdAt: at(-47, 20, 11),
    read: true,
    to: "/wali/tagihan?tab=riwayat",
  },
  {
    id: "ntf-les-mulai",
    kind: "les",
    title: "Les dimulai",
    body: "Matematika & IPA bersama Kak Budi",
    createdAt: at(-19, 16),
    read: true,
    to: "/wali/jadwal",
  },
]

/* Status baca notifikasi turunan (validasi) disimpan terpisah */
const readDerived = new Set<string>()

let counter = 1

/* Dipanggil fitur lain saat terjadi aksi yang perlu dikabarkan */
export function addNotification(
  notification: Omit<AppNotification, "id" | "createdAt" | "read">
) {
  store.push({
    ...notification,
    id: `ntf-${Date.now()}-${counter++}`,
    createdAt: new Date(),
    read: false,
  })
}

/* "2 sesi perlu divalidasi" dari data absensi yang masih menunggu */
async function validationNotification(): Promise<AppNotification | null> {
  const { pending } = await getAttendance()
  if (pending.length === 0) return null

  const sorted = [...pending].sort((a, b) => a.start.getTime() - b.start.getTime())
  const list = sorted
    .map((s) => `${s.subject} ${format(s.start, "d MMM", { locale: localeId })}`)
    .join(" dan ")
  const id = `ntf-validasi-${sorted.map((s) => s.id).join("-")}`

  return {
    id,
    kind: "validasi",
    title: `${pending.length} sesi perlu divalidasi`,
    body: list,
    createdAt: subHours(new Date(), 2),
    read: readDerived.has(id),
    to: "/wali/absensi",
  }
}

async function allNotifications() {
  const validation = await validationNotification()
  return [...store, ...(validation ? [validation] : [])].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

/* ---------- Query ---------- */

export type NotificationList<Kind extends string = NotificationKind> = {
  unread: AppNotification<Kind>[]
  read: AppNotification<Kind>[]
}

export async function getNotifications(): Promise<NotificationList> {
  assertMockAllowed()
  await delay(300)
  const all = await allNotifications()
  return {
    unread: all.filter((n) => !n.read),
    read: all.filter((n) => n.read),
  }
}

export const notificationsQuery = () =>
  queryOptions({
    queryKey: ["notifikasi"],
    queryFn: getNotifications,
    /* Selalu ambil ulang saat layar dibuka: notifikasi bisa bertambah dari fitur lain */
    staleTime: 0,
  })

/* Jumlah belum dibaca untuk titik merah lonceng di layar tab wali */
export function useUnreadNotifications() {
  return useQuery({ ...notificationsQuery(), select: (d) => d.unread.length }).data
}

/* ---------- Aksi ---------- */

function markOne(id: string) {
  const item = store.find((n) => n.id === id)
  if (item) item.read = true
  else readDerived.add(id)
}

export async function markRead(id: string) {
  assertMockAllowed()
  markOne(id)
}

export async function markAllRead() {
  assertMockAllowed()
  await delay(300)
  const all = await allNotifications()
  all.forEach((n) => markOne(n.id))
}
