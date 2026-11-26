import { queryOptions, useQuery } from "@tanstack/react-query"
import { format, setDate, startOfMonth } from "date-fns"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api"
import { listRequestsForReview } from "@/features/jadwal/api"
import type {
  AppNotification,
  NotificationList,
} from "@/features/notifikasi/api/notifikasi"
import { snapshotTutorSessions } from "@/features/presensi/api"

/*
 * Notifikasi Pengelola · Figma PINTARA → UI Screen → Pengelola LBB →
 * P14 · Notifikasi
 *
 * TODO(backend):
 *   getPengelolaNotifications() → httpClient.get("/pengelola/notifikasi")
 *   markPengelolaRead(id)       → httpClient.post(`/pengelola/notifikasi/${id}/dibaca`)
 *   markAllPengelolaRead()      → httpClient.post("/pengelola/notifikasi/dibaca-semua")
 *
 * Tiap notifikasi membuka layar terkait: pendaftaran (P2), pengajuan
 * perubahan jadwal (P5), riwayat notifikasi gagal (P13), keberatan presensi
 * (P6), penawaran (P4), dan rincian tagihan (P8). Tautan pengajuan &
 * keberatan diambil dari data contoh fitur tersebut.
 */
export type PengelolaNotificationKind =
  | "pendaftaran"
  | "perubahan-jadwal"
  | "notifikasi-gagal"
  | "keberatan"
  | "penawaran"
  | "pembayaran"

export type PengelolaNotification = AppNotification<PengelolaNotificationKind>

const readIds = new Set<string>(["pn-penawaran", "pn-pembayaran"])

/* Jam contoh hari ini tidak boleh melewati waktu sekarang (mis. dibuka pagi) */
const earlier = (date: Date, minutesBefore: number) => {
  const cap = new Date(Date.now() - minutesBefore * 60_000)
  return date > cap ? cap : date
}

function buildNotifications(): PengelolaNotification[] {
  const month = startOfMonth(new Date())
  const request = listRequestsForReview()[0]
  const objection = snapshotTutorSessions().find(
    (s) => s.record?.validation === "keberatan"
  )

  const items: Omit<PengelolaNotification, "read">[] = [
    {
      id: "pn-pendaftaran-reg-0121",
      kind: "pendaftaran",
      title: "Pendaftaran baru",
      body: "Fajar Ramadhan · Kelas 9 SMP",
      createdAt: earlier(at(0, 7, 12), 50),
      to: "/pengelola/pendaftaran/reg-0121",
    },
    {
      id: `pn-perubahan-${request?.id ?? "x"}`,
      kind: "perubahan-jadwal",
      title: "Pengajuan perubahan jadwal",
      body: "Aisyah: Rabu → Kamis 16.00",
      createdAt: earlier(at(0, 12, 40), 12),
      to: request
        ? `/pengelola/les/jadwal/pengajuan/${request.id}`
        : "/pengelola/les?tab=jadwal",
    },
    {
      id: "pn-notifikasi-gagal",
      kind: "notifikasi-gagal",
      title: "2 notifikasi gagal terkirim",
      body: "Pengingat presensi & hasil verifikasi",
      createdAt: earlier(at(0, 8, 10), 35),
      to: "/pengelola/riwayat-notifikasi?status=gagal",
    },
    {
      id: `pn-keberatan-${objection?.id ?? "x"}`,
      kind: "keberatan",
      title: "Keberatan presensi",
      body: "Aisyah × Kak Budi",
      createdAt: objection?.record?.objection?.at ?? at(-7, 20),
      to: objection
        ? `/pengelola/presensi/keberatan/${objection.id}`
        : "/pengelola/presensi",
    },
    {
      id: "pn-penawaran",
      kind: "penawaran",
      title: "Penawaran diterima",
      body: "Nadia × Kak Dimas",
      createdAt: at(-8, 10, 5),
      to: "/pengelola/les?tab=penawaran",
    },
    {
      id: "pn-pembayaran",
      kind: "pembayaran",
      title: "Pembayaran tagihan masuk",
      body: "Aisyah · Rp300.000 via QRIS",
      createdAt: setDate(month, 12),
      /* Rincian tagihan Aisyah bulan ini (P8) */
      to: `/pengelola/laporan-keuangan/tagihan/${format(month, "yyyy-MM")}-3`,
    },
  ]

  return items.map((n) => ({ ...n, read: readIds.has(n.id) }))
}

/* ---------- Query ---------- */

export async function getPengelolaNotifications(): Promise<
  NotificationList<PengelolaNotificationKind>
> {
  assertMockAllowed()
  await delay(300)
  const all = buildNotifications()
  /* "Baru" urut sesuai prioritas tindakan; "Sebelumnya" terbaru dulu */
  return {
    unread: all.filter((n) => !n.read),
    read: all
      .filter((n) => n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  }
}

export const pengelolaNotificationsQuery = () =>
  queryOptions({
    queryKey: ["notifikasi", "pengelola"],
    queryFn: getPengelolaNotifications,
    staleTime: 0,
  })

/* Jumlah belum dibaca untuk titik merah lonceng di layar tab pengelola */
export function usePengelolaUnreadNotifications() {
  return useQuery({
    ...pengelolaNotificationsQuery(),
    select: (d) => d.unread.length,
  }).data
}

/* ---------- Aksi ---------- */

export async function markPengelolaRead(id: string) {
  assertMockAllowed()
  readIds.add(id)
}

export async function markAllPengelolaRead() {
  assertMockAllowed()
  await delay(300)
  buildNotifications().forEach((n) => readIds.add(n.id))
}
