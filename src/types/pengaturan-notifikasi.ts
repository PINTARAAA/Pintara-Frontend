export type Channel = "whatsapp" | "email" | "aplikasi"

export type Timing =
  | { kind: "sebelum_sesi"; hoursBefore: number }
  | { kind: "setelah_sesi"; daysAfter: number; time: string; maxRepeat: number }
  | { kind: "kejadian" }

export type NotificationSetting = {
  id: string
  group: "pengingat" | "kejadian"
  title: string
  screenTitle: string
  recipient: string
  trigger: string
  activeNote: string
  enabled: boolean
  channel: Channel
  timing: Timing
  template: string
  variables: string[]
  sample: Record<string, string>
  previewNote: string
}

export type SettingInput = Pick<
  NotificationSetting,
  "enabled" | "channel" | "timing" | "template"
>
