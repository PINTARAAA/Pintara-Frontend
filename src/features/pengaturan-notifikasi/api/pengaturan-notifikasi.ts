import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, delay } from "@/lib/data/mock"
import { settings } from "@/lib/data/pengaturan-notifikasi"
import type {
  Channel,
  NotificationSetting,
  SettingInput,
} from "@/types/pengaturan-notifikasi"

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

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  aplikasi: "Notifikasi aplikasi",
}

export const TEMPLATE_MAX = 500

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
