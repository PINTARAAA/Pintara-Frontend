import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  TimePicker,
  toast,
} from "@/components"
import {
  CHANNEL_LABEL,
  fillTemplate,
  InvalidTemplateError,
  NotFoundError,
  notificationSettingQuery,
  saveNotificationSetting,
  TEMPLATE_MAX,
  unknownVariables,
} from "@/features/pengaturan-notifikasi/api"
import type {
  Channel,
  NotificationSetting,
  Timing,
} from "@/types/pengaturan-notifikasi"

/*
 * P12 · Ubah Pengaturan Notifikasi · Figma "Pengaturan Notifikasi / Ubah
 * pengingat presensi" dan "Error - Template tidak valid".
 *
 * Kartu "Pengingat aktif" (Switch) → Waktu pengiriman (pengingat saja) →
 * Kanal → Template pesan (counter 500, chip variabel menyisipkan di posisi
 * kursor) → Pratinjau dengan contoh data. Variabel tak dikenal → banner
 * error di atas + pesan di bawah kolom. Tersimpan → kembali ke daftar + toast.
 */
const CHANNELS = Object.keys(CHANNEL_LABEL) as Channel[]
const HOURS_BEFORE = [1, 2, 3, 24]
const DAYS_AFTER = [1, 2]
const MAX_REPEAT = [1, 2, 3, 5]
const hoursLabel = (h: number) => (h >= 24 ? `${h / 24} hari sebelum sesi` : `${h} jam sebelum sesi`)

function UbahNotifikasi() {
  const { settingId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(notificationSettingQuery(settingId))

  if (query.data) return <SettingForm setting={query.data} />

  return (
    <DetailScreen
      title="Ubah Notifikasi"
      backLabel="Pengaturan Notifikasi"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat pengaturan…" />
      ) : query.error instanceof NotFoundError ? (
        <DataState
          state="empty"
          title="Pengaturan tidak ditemukan"
          description="Tautan pengaturan ini mungkin keliru."
          action={{
            label: "Kembali ke Pengaturan Notifikasi",
            onClick: () => navigate("/pengelola/pengaturan-notifikasi", { replace: true }),
          }}
        />
      ) : (
        <DataState
          state="error"
          title="Pengaturan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      )}
    </DetailScreen>
  )
}

function SettingForm({ setting }: { setting: NotificationSetting }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = React.useState(setting.enabled)
  const [channel, setChannel] = React.useState<Channel>(setting.channel)
  const [timing, setTiming] = React.useState<Timing>(setting.timing)
  const [template, setTemplate] = React.useState(setting.template)
  const [templateError, setTemplateError] = React.useState<string | null>(null)
  const [unknown, setUnknown] = React.useState<string[]>([])
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const validate = () => {
    const bad = unknownVariables(template, setting.variables)
    setUnknown(bad)
    const message = !template.trim()
      ? "Isi pesan wajib diisi."
      : template.length > TEMPLATE_MAX
        ? `Isi pesan maksimal ${TEMPLATE_MAX} karakter.`
        : bad.length > 0
          ? `Variabel ${bad.map((v) => `{${v}}`).join(", ")} tidak dikenal.`
          : null
    setTemplateError(message)
    return message === null
  }

  const showInvalid = (variables: string[]) => {
    setUnknown(variables)
    setTemplateError(`Variabel ${variables.map((v) => `{${v}}`).join(", ")} tidak dikenal.`)
  }

  /* Banner muncul di atas: gulir ke sana agar pesan error terlihat */
  React.useEffect(() => {
    if (unknown.length > 0) window.scrollTo({ top: 0, behavior: "smooth" })
  }, [unknown])

  const save = useMutation({
    mutationFn: () =>
      saveNotificationSetting(setting.id, { enabled, channel, timing, template }),
    networkMode: "always",
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["pengaturan-notifikasi"] })
      toast.success("Pengaturan tersimpan", {
        description: !saved.enabled
          ? `${saved.title} tidak akan dikirim sampai diaktifkan lagi.`
          : saved.timing.kind === "setelah_sesi"
            ? `Berlaku mulai pengingat berikutnya (besok, ${saved.timing.time}).`
            : saved.timing.kind === "sebelum_sesi"
              ? "Berlaku mulai sesi berikutnya."
              : "Berlaku untuk kejadian berikutnya.",
      })
      navigate(-1)
    },
    onError: (error) => {
      if (error instanceof InvalidTemplateError) showInvalid(error.variables)
      else
        toast.error("Pengaturan gagal disimpan", {
          description: "Isian Anda tetap tersimpan. Periksa koneksi lalu coba lagi.",
        })
    },
  })

  /* Sisipkan {variabel} di posisi kursor, lalu kembalikan fokus ke kolom */
  const insertVariable = (name: string) => {
    const el = textareaRef.current
    const token = `{${name}}`
    const start = el?.selectionStart ?? template.length
    const end = el?.selectionEnd ?? template.length
    const next = template.slice(0, start) + token + template.slice(end)
    setTemplate(next)
    if (templateError) setTemplateError(null)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const counter = `${template.length}/${TEMPLATE_MAX}`
  const channelField = (
    <SelectField
      id="channel"
      label="Kanal"
      value={channel}
      options={CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))}
      onChange={(v) => setChannel(v as Channel)}
    />
  )

  return (
    <DetailScreen
      title={setting.screenTitle}
      backLabel="Pengaturan Notifikasi"
      desktopHeader="page"
      desktopWidth="wide"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <>
          {/* Figma: Batal hanya ada di desktop */}
          <Button
            variant="secondary"
            className="hidden lg:inline-flex"
            onClick={() => navigate(-1)}
          >
            Batal
          </Button>
          <Button
            onClick={() => validate() && save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Pengaturan"}
          </Button>
        </>
      }
    >
      {unknown.length > 0 && (
        <AlertBanner
          status="error"
          title="Template belum bisa disimpan"
          description={`Variabel ${unknown.map((v) => `{${v}}`).join(", ")} tidak dikenal. Gunakan variabel yang tersedia di bawah kolom template.`}
        />
      )}

      {/*
       * Desktop (Figma "… / Ubah pengingat presensi (Desktop)"): dua kolom
       * (jarak 48) — status + waktu pengiriman di kiri, template + pratinjau
       * di kanan. Banner error tetap selebar konten di atasnya.
       */}
      <div className="contents lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12">
      <div className="lg:gap-ns-2xl contents lg:flex lg:flex-col">
      <label className="gap-ns-m bg-grayscale-surface-subtitle px-ns-l py-ns-m flex cursor-pointer items-center rounded-(--comp-radius-md) leading-normal">
        <span className="gap-ns-2xs flex min-w-0 flex-1 flex-col">
          <span className="text-subtitle leading-normal text-grayscale-text-title font-bold">
            {setting.group === "pengingat" ? "Pengingat aktif" : "Notifikasi aktif"}
          </span>
          <span className="text-caption leading-normal text-grayscale-text-caption">
            {setting.activeNote}
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </label>

      {timing.kind !== "kejadian" && (
        <Section title="Waktu pengiriman">
          {timing.kind === "sebelum_sesi" ? (
            <SelectField
              id="hours-before"
              label="Kirim sebelum sesi"
              value={String(timing.hoursBefore)}
              options={HOURS_BEFORE.map((h) => ({ value: String(h), label: hoursLabel(h) }))}
              onChange={(v) => setTiming({ ...timing, hoursBefore: Number(v) })}
            />
          ) : (
            <>
              <SelectField
                id="days-after"
                label="Kirim jika belum diisi setelah"
                value={String(timing.daysAfter)}
                options={DAYS_AFTER.map((d) => ({ value: String(d), label: `${d} hari setelah sesi` }))}
                onChange={(v) => setTiming({ ...timing, daysAfter: Number(v) })}
              />
              <div className="gap-ns-m grid grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="send-time" required>
                    Jam kirim
                  </FieldLabel>
                  <TimePicker
                    id="send-time"
                    start="06.00"
                    end="20.00"
                    value={timing.time}
                    onValueChange={(v) => v && setTiming({ ...timing, time: v })}
                  />
                </Field>
                <SelectField
                  id="max-repeat"
                  label="Ulangi"
                  value={String(timing.maxRepeat)}
                  options={MAX_REPEAT.map((n) => ({ value: String(n), label: `Maks. ${n} hari` }))}
                  onChange={(v) => setTiming({ ...timing, maxRepeat: Number(v) })}
                />
              </div>
            </>
          )}
          {channelField}
        </Section>
      )}

      {timing.kind === "kejadian" && channelField}
      </div>

      <div className="lg:gap-ns-2xl contents lg:flex lg:flex-col">
      <Section title="Template pesan">
        <Field>
          <FieldLabel htmlFor="template" required>
            Isi pesan
          </FieldLabel>
          <Textarea
            id="template"
            ref={textareaRef}
            value={template}
            maxLength={TEMPLATE_MAX}
            onChange={(e) => {
              setTemplate(e.target.value)
              if (templateError) setTemplateError(null)
            }}
            aria-invalid={templateError ? true : undefined}
            aria-describedby={templateError ? "template-error" : "template-help"}
          />
          {templateError ? (
            <FieldError id="template-error" counter={counter}>
              {templateError}
            </FieldError>
          ) : (
            <FieldDescription id="template-help" counter={counter}>
              Variabel diganti data sebenarnya saat pesan dikirim.
            </FieldDescription>
          )}
        </Field>
        <div className="gap-ns-s flex flex-col">
          <p className="text-caption text-grayscale-text-caption leading-normal">
            Ketuk untuk menyisipkan variabel:
          </p>
          <div className="gap-ns-s flex flex-wrap">
            {setting.variables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="bg-primary-surface-subtitle px-ns-s py-ns-2xs text-caption text-primary-text-primary hover:bg-primary-surface-default/15 focus-visible:ring-primary-border-lighter rounded-full leading-normal font-bold outline-none focus-visible:ring-2"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {!templateError && template.trim() && (
        <Section title="Pratinjau">
          <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
            <p className="text-subtitle text-grayscale-text-title whitespace-pre-wrap">
              {fillTemplate(template, setting.sample)}
            </p>
            <p className="text-caption text-grayscale-text-caption">
              {setting.previewNote}
            </p>
          </div>
        </Section>
      )}
      </div>
      </div>
    </DetailScreen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gap-ns-l flex flex-col">
      <h2 className="text-body text-grayscale-text-title leading-normal font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id} required>
        {label}
      </FieldLabel>
      <Select
        items={options}
        value={value}
        onValueChange={(v) => v && onChange(v as string)}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className="p-0">
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

export { UbahNotifikasi }
