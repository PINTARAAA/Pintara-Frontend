import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/features/dashboard/api"

/*
 * Pengaturan Notifikasi · Figma PINTARA → UI Screen → Pengelola LBB →
 * P12 · Pengaturan Notifikasi
 *
 * TODO(backend):
 *   getNotificationSettings()       → httpClient.get("/pengelola/pengaturan-notifikasi")
 *   getNotificationSetting(id)      → httpClient.get(`/pengelola/pengaturan-notifikasi/${id}`)
 *   saveNotificationSetting(id, …)  → httpClient.put(`/pengelola/pengaturan-notifikasi/${id}`, input)
 *                                     (422 bila template memakai variabel tak dikenal)
 *
 * Pengingat otomatis dikirim terjadwal; notifikasi kejadian dikirim saat ada
 * kejadian di sistem. Template memakai variabel {nama_variabel} yang diganti
 * data sebenarnya saat dikirim.
 */
export type Channel = "whatsapp" | "email" | "aplikasi"

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  aplikasi: "Notifikasi aplikasi",
}

export type Timing =
  /* Sebelum sesi dimulai, dalam jam */
  | { kind: "sebelum_sesi"; hoursBefore: number }
  /* Belum diisi N hari setelah sesi, dikirim jam tertentu, diulang maks. N hari */
  | { kind: "setelah_sesi"; daysAfter: number; time: string; maxRepeat: number }
  | { kind: "kejadian" }

export type NotificationSetting = {
  id: string
  group: "pengingat" | "kejadian"
  title: string
  /* Judul layar ubah, mis. "Pengingat Presensi" */
  screenTitle: string
  recipient: string
  trigger: string
  /* Keterangan kartu "aktif", mis. "Dikirim ke tutor yang belum mengisi presensi" */
  activeNote: string
  enabled: boolean
  channel: Channel
  timing: Timing
  template: string
  variables: string[]
  /* Contoh nilai variabel untuk pratinjau */
  sample: Record<string, string>
  previewNote: string
}

export const TEMPLATE_MAX = 500

const settings: NotificationSetting[] = [
  {
    id: "pengingat-jadwal",
    group: "pengingat",
    title: "Pengingat jadwal les",
    screenTitle: "Pengingat Jadwal Les",
    recipient: "Ke tutor",
    trigger: "sebelum sesi",
    activeNote: "Dikirim ke tutor sebelum setiap sesi dimulai",
    enabled: true,
    channel: "whatsapp",
    timing: { kind: "sebelum_sesi", hoursBefore: 2 },
    template:
      "Halo {nama_tutor}, pengingat les {mapel} bersama {nama_siswa} hari ini pukul {jam} di {alamat}.",
    variables: ["nama_tutor", "nama_siswa", "mapel", "jam", "alamat"],
    sample: {
      nama_tutor: "Kak Budi",
      nama_siswa: "Aisyah Putri",
      mapel: "Matematika",
      jam: "16.00",
      alamat: "Jl. Trunojoyo No. 12",
    },
    previewNote: "Contoh dengan data tutor sebenarnya",
  },
  {
    id: "pengingat-presensi",
    group: "pengingat",
    title: "Pengingat presensi",
    screenTitle: "Pengingat Presensi",
    recipient: "Ke tutor",
    trigger: "jika presensi belum diisi",
    activeNote: "Dikirim ke tutor yang belum mengisi presensi",
    enabled: true,
    channel: "whatsapp",
    timing: { kind: "setelah_sesi", daysAfter: 1, time: "08.00", maxRepeat: 3 },
    template:
      "Halo {nama_tutor}, presensi les {mapel} bersama {nama_siswa} pada {tanggal} belum diisi. Mohon isi di PINTARA ya.",
    variables: ["nama_tutor", "nama_siswa", "mapel", "tanggal", "jam"],
    sample: {
      nama_tutor: "Kak Yoga",
      nama_siswa: "Rafi Hidayat",
      mapel: "Fisika",
      tanggal: "Senin, 23 Nov",
      jam: "19.00",
    },
    previewNote: "Contoh dengan data tutor sebenarnya",
  },
  {
    id: "pendaftaran-baru",
    group: "kejadian",
    title: "Pendaftaran baru",
    screenTitle: "Pendaftaran Baru",
    recipient: "Ke pengelola",
    trigger: "saat wali mengirim pendaftaran",
    activeNote: "Dikirim ke pengelola saat ada pendaftaran baru",
    enabled: true,
    channel: "aplikasi",
    timing: { kind: "kejadian" },
    template:
      "Pendaftaran baru dari {nama_wali} untuk {nama_siswa} ({kelas}). Segera verifikasi di PINTARA.",
    variables: ["nama_wali", "nama_siswa", "kelas"],
    sample: { nama_wali: "Sari Wulandari", nama_siswa: "Aisyah Putri", kelas: "8 SMP" },
    previewNote: "Contoh dengan data pendaftaran terakhir",
  },
  {
    id: "hasil-verifikasi",
    group: "kejadian",
    title: "Hasil verifikasi pendaftaran",
    screenTitle: "Hasil Verifikasi",
    recipient: "Ke wali",
    trigger: "saat diverifikasi atau ditolak",
    activeNote: "Dikirim ke wali setelah pendaftaran diperiksa",
    enabled: true,
    channel: "whatsapp",
    timing: { kind: "kejadian" },
    template:
      "Halo {nama_wali}, pendaftaran {nama_siswa} {status}. Lihat detailnya di PINTARA.",
    variables: ["nama_wali", "nama_siswa", "status"],
    sample: { nama_wali: "Ibu Sari", nama_siswa: "Aisyah Putri", status: "sudah diverifikasi" },
    previewNote: "Contoh dengan data pendaftaran terakhir",
  },
  {
    id: "penawaran-tutor",
    group: "kejadian",
    title: "Penawaran tutor",
    screenTitle: "Penawaran Tutor",
    recipient: "Ke tutor",
    trigger: "saat penawaran dikirim",
    activeNote: "Dikirim ke tutor saat ada penawaran siswa baru",
    enabled: true,
    channel: "whatsapp",
    timing: { kind: "kejadian" },
    template:
      "Halo {nama_tutor}, ada penawaran les {mapel} untuk {nama_siswa} setiap {jadwal}. Konfirmasi di PINTARA.",
    variables: ["nama_tutor", "nama_siswa", "mapel", "jadwal"],
    sample: { nama_tutor: "Kak Dimas", nama_siswa: "Rafi Hidayat", mapel: "Fisika", jadwal: "Senin 19.00" },
    previewNote: "Contoh dengan data penawaran terakhir",
  },
  {
    id: "keberatan-presensi",
    group: "kejadian",
    title: "Keberatan presensi",
    screenTitle: "Keberatan Presensi",
    recipient: "Ke pengelola dan tutor",
    trigger: "saat wali mengajukan keberatan",
    activeNote: "Dikirim saat wali mengajukan keberatan presensi",
    enabled: true,
    channel: "aplikasi",
    timing: { kind: "kejadian" },
    template:
      "{nama_wali} mengajukan keberatan atas presensi {mapel} {nama_siswa} pada {tanggal}.",
    variables: ["nama_wali", "nama_siswa", "mapel", "tanggal"],
    sample: { nama_wali: "Sari Wulandari", nama_siswa: "Aisyah Putri", mapel: "Matematika", tanggal: "19 Nov" },
    previewNote: "Contoh dengan data keberatan terakhir",
  },
  {
    id: "rekap-honor",
    group: "kejadian",
    title: "Rekap honor siap",
    screenTitle: "Rekap Honor Siap",
    recipient: "Ke pengelola",
    trigger: "saat semua presensi bulan ini final",
    activeNote: "Dikirim ke pengelola saat rekap honor bisa dihitung",
    enabled: false,
    channel: "aplikasi",
    timing: { kind: "kejadian" },
    template: "Semua presensi {bulan} sudah final. Rekap honor siap dihitung di PINTARA.",
    variables: ["bulan"],
    sample: { bulan: "November 2026" },
    previewNote: "Contoh dengan periode berjalan",
  },
]

/* ---------- Ringkasan ---------- */

export function describeTiming(s: Pick<NotificationSetting, "timing" | "channel">) {
  const t = s.timing
  if (t.kind === "sebelum_sesi")
    return `${t.hoursBefore >= 24 ? `${t.hoursBefore / 24} hari` : `${t.hoursBefore} jam`} sebelum sesi · ${CHANNEL_LABEL[s.channel]}`
  if (t.kind === "setelah_sesi")
    return `tiap ${t.time} jika presensi ${t.daysAfter === 1 ? "kemarin" : `${t.daysAfter} hari lalu`} belum diisi · maks. ${t.maxRepeat} kali`
  return ""
}

export const describeSetting = (s: NotificationSetting) =>
  [s.recipient, s.group === "pengingat" ? describeTiming(s) : s.trigger].join(" · ")

/* ---------- Template ---------- */

/* Variabel yang dipakai template tetapi tidak tersedia */
export function unknownVariables(template: string, allowed: string[]) {
  const used = [...template.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1].trim())
  return [...new Set(used.filter((v) => !allowed.includes(v)))]
}

export const fillTemplate = (template: string, sample: Record<string, string>) =>
  template.replace(/\{([^{}]*)\}/g, (match, name: string) => sample[name.trim()] ?? match)

/* ---------- API ---------- */

export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  assertMockAllowed()
  await delay()
  return structuredClone(settings)
}

export const notificationSettingsQuery = () =>
  queryOptions({
    queryKey: ["pengaturan-notifikasi"],
    queryFn: getNotificationSettings,
  })

export class NotFoundError extends Error {
  constructor() {
    super("Pengaturan tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

export class InvalidTemplateError extends Error {
  readonly variables: string[]
  constructor(variables: string[]) {
    super(`Variabel ${variables.map((v) => `{${v}}`).join(", ")} tidak dikenal.`)
    this.name = "InvalidTemplateError"
    this.variables = variables
  }
}

function findSetting(id: string) {
  const setting = settings.find((s) => s.id === id)
  if (!setting) throw new NotFoundError()
  return setting
}

export async function getNotificationSetting(id: string): Promise<NotificationSetting> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(findSetting(id))
}

export const notificationSettingQuery = (id: string) =>
  queryOptions({
    queryKey: ["pengaturan-notifikasi", id],
    queryFn: () => getNotificationSetting(id),
  })

export type SettingInput = Pick<
  NotificationSetting,
  "enabled" | "channel" | "timing" | "template"
>

export async function saveNotificationSetting(
  id: string,
  input: Partial<SettingInput>
): Promise<NotificationSetting> {
  assertMockAllowed()
  await delay(600)
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const setting = findSetting(id)
  if (input.template !== undefined) {
    const unknown = unknownVariables(input.template, setting.variables)
    if (unknown.length > 0) throw new InvalidTemplateError(unknown)
  }
  Object.assign(setting, input)
  return structuredClone(setting)
}
