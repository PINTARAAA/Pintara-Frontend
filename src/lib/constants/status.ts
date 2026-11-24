/*
 * Peta status → label + tone untuk Badge.
 * Sumber: Figma PINTARA → Components → 05 · Data Display → Badge
 * (Category × Status). Label mengikuti status agar makna tidak tertukar.
 */
export type StatusTone = "success" | "warning" | "error" | "info" | "neutral"

export const STATUS_MAP = {
  pendaftaran: {
    menunggu_verifikasi: { label: "Menunggu Verifikasi", tone: "warning" },
    terverifikasi: { label: "Terverifikasi", tone: "success" },
    ditolak: { label: "Ditolak", tone: "error" },
    diarsipkan: { label: "Diarsipkan", tone: "neutral" },
  },
  penawaran_tutor: {
    menunggu_konfirmasi: { label: "Menunggu Konfirmasi", tone: "warning" },
    diterima: { label: "Diterima", tone: "success" },
    ditolak: { label: "Ditolak", tone: "error" },
  },
  presensi: {
    sudah_dikumpulkan: { label: "Sudah Dikumpulkan", tone: "info" },
    belum_dikumpulkan: { label: "Belum Dikumpulkan", tone: "neutral" },
    sudah_divalidasi: { label: "Sudah Divalidasi", tone: "success" },
    belum_divalidasi: { label: "Belum Divalidasi", tone: "warning" },
    keberatan: { label: "Keberatan", tone: "warning" },
  },
  pembayaran: {
    lunas: { label: "Lunas", tone: "success" },
    sebagian: { label: "Sebagian", tone: "warning" },
    belum_bayar: { label: "Belum Bayar", tone: "error" },
  },
  notifikasi: {
    terkirim: { label: "Terkirim", tone: "success" },
    gagal: { label: "Gagal", tone: "error" },
  },
  akun: {
    aktif: { label: "Aktif", tone: "success" },
    nonaktif: { label: "Nonaktif", tone: "neutral" },
  },
} as const satisfies Record<
  string,
  Record<string, { label: string; tone: StatusTone }>
>

export type StatusCategory = keyof typeof STATUS_MAP
export type StatusOf<C extends StatusCategory> = keyof (typeof STATUS_MAP)[C]
