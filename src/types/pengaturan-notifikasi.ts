export type Channel = "whatsapp" | "email" | "aplikasi"

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

export type SettingInput = Pick<
  NotificationSetting,
  "enabled" | "channel" | "timing" | "template"
>
