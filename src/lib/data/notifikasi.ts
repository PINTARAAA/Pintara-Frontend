import { format, subHours } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { at } from "@/lib/data/mock"
import type { AppNotification } from "@/types/notifikasi"

/* ---------- Notifikasi Wali Murid · W9 ---------- */

const now = new Date()
const eightAm = at(0, 8)

export const notificationsStore: AppNotification[] = [
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

/* ID notifikasi contoh yang sudah dibaca */
export const tutorReadIds = new Set<string>(["tn-rekap", "tn-honor"])
export const pengelolaReadIds = new Set<string>(["pn-penawaran", "pn-pembayaran"])
