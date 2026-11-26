import { at } from "@/lib/data/mock"
import type {
  LogNotificationKind,
  NotificationLog,
  Recipient,
} from "@/types/riwayat-notifikasi"

/* ---------- Data contoh ---------- */

const yoga: Recipient = {
  name: "Kak Yoga Pratama",
  role: "tutor",
  contact: "0838-0000-1212",
  accountId: "ak-tt-yoga",
}
const andi: Recipient = {
  name: "Andi Saputra",
  role: "wali",
  contact: "0813-4400-1122",
  accountId: "ak-wali-4",
}
const budi: Recipient = {
  name: "Kak Budi Santoso",
  role: "tutor",
  contact: "0857-1122-3344",
  accountId: "ak-tt-budi",
}
const dimas: Recipient = {
  name: "Kak Dimas Arya",
  role: "tutor",
  contact: "0812-4455-6677",
  accountId: "ak-tt-dimas",
}
const ila: Recipient = {
  name: "Kak Ila",
  role: "pengelola",
  contact: "ila.pintara@gmail.com",
}
const sari: Recipient = {
  name: "Sari Wulandari",
  role: "wali",
  contact: "0812-3456-7890",
  accountId: "ak-wali-1",
}

let seq = 0
const log = (
  kind: LogNotificationKind,
  recipients: Recipient[],
  sentAt: Date,
  message: string,
  extra: Partial<NotificationLog> = {}
): NotificationLog => ({
  id: `log-${++seq}`,
  kind,
  channel:
    kind === "pendaftaran-baru" ||
    kind === "keberatan-presensi" ||
    kind === "rekap-honor"
      ? "aplikasi"
      : "whatsapp",
  recipients,
  sentAt,
  status: "terkirim",
  message,
  attempts: 1,
  lastAttemptAt: sentAt,
  ...extra,
})

export const logs: NotificationLog[] = [
  log(
    "pengingat-presensi",
    [yoga],
    at(0, 8),
    "Halo Kak Yoga, presensi les Fisika bersama Rafi Hidayat pada Senin, 23 Nov belum diisi. Mohon isi di PINTARA ya.",
    {
      status: "gagal",
      attempts: 3,
      lastAttemptAt: at(0, 8, 10),
      reason: "Nomor WhatsApp tidak aktif",
      reasonShort: "nomor tidak aktif",
      permanent: true,
    }
  ),
  log(
    "hasil-verifikasi",
    [andi],
    at(0, 7, 40),
    "Halo Pak Andi, pendaftaran Bima Maharani sudah diverifikasi. Lihat detailnya di PINTARA.",
    {
      status: "gagal",
      attempts: 2,
      lastAttemptAt: at(0, 7, 45),
      reason: "Tidak terjangkau",
      reasonShort: "tidak terjangkau",
    }
  ),
  log(
    "pengingat-presensi",
    [budi],
    at(0, 8),
    "Halo Kak Budi, presensi les IPA bersama Dimas Pratama pada Kamis, 26 Nov belum diisi. Mohon isi di PINTARA ya."
  ),
  log(
    "pengingat-jadwal",
    [dimas],
    at(0, 14),
    "Halo Kak Dimas, pengingat les Fisika bersama Rafi Hidayat hari ini pukul 16.00 di Jl. Kartini No. 7."
  ),
  log(
    "pendaftaran-baru",
    [ila],
    at(0, 7, 12),
    "Pendaftaran baru dari Agus Setiawan untuk Kirana Maharani (12 SMA). Segera verifikasi di PINTARA."
  ),
  log(
    "keberatan-presensi",
    [ila, budi],
    at(0, 9, 30),
    "Sari Wulandari mengajukan keberatan atas presensi Matematika Aisyah Putri pada 19 Nov."
  ),
  /* Hari-hari sebelumnya */
  log(
    "pengingat-jadwal",
    [budi],
    at(-1, 14),
    "Halo Kak Budi, pengingat les Matematika bersama Aisyah Putri hari ini pukul 16.00 di Jl. Trunojoyo No. 12."
  ),
  log(
    "penawaran-tutor",
    [dimas],
    at(-2, 10, 5),
    "Halo Kak Dimas, ada penawaran les Matematika untuk Nadia Salsabila setiap Selasa 16.00. Konfirmasi di PINTARA."
  ),
  log(
    "hasil-verifikasi",
    [sari],
    at(-3, 11),
    "Halo Ibu Sari, pendaftaran Aisyah Putri sudah diverifikasi. Lihat detailnya di PINTARA."
  ),
  log(
    "pengingat-presensi",
    [yoga],
    at(-1, 8),
    "Halo Kak Yoga, presensi les Fisika bersama Rafi Hidayat pada Senin, 23 Nov belum diisi. Mohon isi di PINTARA ya.",
    {
      status: "gagal",
      attempts: 3,
      lastAttemptAt: at(-1, 8, 10),
      reason: "Nomor WhatsApp tidak aktif",
      reasonShort: "nomor tidak aktif",
      permanent: true,
    }
  ),
  /* Bulan lalu */
  log(
    "penawaran-tutor",
    [budi],
    at(-40, 9),
    "Halo Kak Budi, ada penawaran les IPA untuk Aisyah Putri setiap Jumat 16.00. Konfirmasi di PINTARA."
  ),
  log(
    "rekap-honor",
    [ila],
    at(-27, 7),
    "Semua presensi Oktober 2026 sudah final. Rekap honor siap dihitung di PINTARA."
  ),
]
