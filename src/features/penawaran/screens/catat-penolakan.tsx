import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router"
import { z } from "zod"

import {
  DetailScreen,
  ResultScreen,
  RESULT_BUTTON_DESKTOP,
  AlertBanner,
  Button,
  DataState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
  Textarea,
  toast,
} from "@/components"
import {
  OfferError,
  offerQuery,
  recordDeclined,
} from "@/features/penawaran/api"
import { DECLINE_REASONS } from "@/lib/data/penawaran"
import type { DeclineReason, Offer } from "@/types/penawaran"
import { ResultOfferCard } from "@/features/penawaran/components"
import { getErrorMessage } from "@/lib/api"
import { firstName } from "@/lib/format"
import { isNotFoundError } from "@/features/verifikasi/api"

/*
 * P4 · Catat Penolakan · Figma "Penawaran / Catat ditolak" dan
 * "Penawaran / Ditolak".
 *
 * Ringkasan (siswa × tutor, mapel · jadwal) → Alasan tutor menolak (Radio,
 * wajib) → Catatan (opsional; wajib bila "Lainnya") → banner info siswa
 * kembali ke pencocokan. Bilah aksi: Batal · Simpan Penolakan
 * (Destructive). Setelah tersimpan tampil layar hasil "Penolakan tercatat".
 *
 * Desktop (Figma "… (Desktop)"): Page header "← Detail Penawaran", formulir
 * selebar 720px, alasan dalam dua kolom, tombol rata kanan di bawah garis
 * pemisah. Layar hasil: Page header "Penawaran".
 */
const LES = "/pengelola/les"
const NOTE_MAX = 500
const REASON_VALUES = DECLINE_REASONS.map((r) => r.value) as [
  DeclineReason,
  ...DeclineReason[],
]

const schema = z
  .object({
    reason: z.enum(REASON_VALUES, { error: "Pilih alasan tutor menolak." }),
    note: z
      .string()
      .trim()
      .max(NOTE_MAX, `Catatan maksimal ${NOTE_MAX} karakter.`),
  })
  .refine((v) => v.reason !== "lainnya" || v.note.length > 0, {
    path: ["note"],
    message: "Jelaskan alasannya bila memilih Lainnya.",
  })
type DeclineForm = z.infer<typeof schema>

function CatatPenolakan() {
  const { offerId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(offerQuery(offerId))
  const [saved, setSaved] = React.useState<Offer | null>(null)

  if (saved) {
    return <DeclinedResult offer={saved} />
  }
  if (query.data?.status === "menunggu_konfirmasi") {
    return <DeclineFormScreen offer={query.data} onSaved={setSaved} />
  }

  return (
    <DetailScreen
      title="Catat Penolakan"
      backLabel="Detail Penawaran"
      desktopHeader="page"
      desktopWidth="form"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat penawaran…" />
      ) : query.isError && !isNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Penawaran gagal dimuat"
          description={getErrorMessage(query.error)}
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Penawaran tidak ditemukan"
              : "Jawaban tutor sudah dicatat"
          }
          description="Penolakan hanya bisa dicatat untuk penawaran yang masih menunggu jawaban tutor."
          action={{
            label: "Kembali ke Penawaran",
            onClick: () => navigate(`${LES}?tab=penawaran`, { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

function DeclineFormScreen({
  offer,
  onSaved,
}: {
  offer: Offer
  onSaved: (offer: Offer) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<DeclineForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { note: "" },
  })
  const { errors } = form.formState
  const note = useWatch({ control: form.control, name: "note" }) ?? ""
  const reason = useWatch({ control: form.control, name: "reason" })
  const student = firstName(offer.student.name)

  const save = useMutation({
    mutationFn: (values: DeclineForm) => recordDeclined(offer.id, values),
    networkMode: "always",
    onSuccess: (updated) => {
      queryClient.setQueryData(offerQuery(offer.id).queryKey, updated)
      void queryClient.invalidateQueries({ queryKey: ["penawaran", "daftar"] })
      void queryClient.invalidateQueries({ queryKey: ["pencocokan"] })
      void queryClient.invalidateQueries({ queryKey: ["verifikasi"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      onSaved(updated)
    },
    onError: (error) => {
      if (error instanceof OfferError && error.code === "already_answered") {
        toast.error("Jawaban tutor sudah dicatat", {
          description: "Status terbaru ditampilkan.",
        })
        void queryClient.invalidateQueries({ queryKey: ["penawaran"] })
        navigate(`${LES}/penawaran/${offer.id}`, { replace: true })
        return
      }
      toast.error("Penolakan gagal disimpan", {
        description:
          "Isian Anda tetap tersimpan. Periksa koneksi lalu coba lagi.",
      })
    },
  })

  return (
    <DetailScreen
      title="Catat Penolakan"
      backLabel="Detail Penawaran"
      desktopHeader="page"
      desktopWidth="form"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={form.handleSubmit((values) => save.mutate(values))}
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Penolakan"}
          </Button>
        </>
      }
    >
      <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
        <p className="text-subtitle text-grayscale-text-title font-bold">
          {offer.student.name} × {offer.tutor.name}
        </p>
        <p className="text-caption text-grayscale-text-caption">
          {offer.subjects.join(", ")} · {offer.schedule}
        </p>
      </div>

      <form
        noValidate
        aria-label="Formulir penolakan tutor"
        onSubmit={(e) => e.preventDefault()}
        className="gap-ns-2xl flex flex-col"
      >
        <fieldset
          className="gap-ns-m flex flex-col"
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={errors.reason ? "reason-error" : undefined}
        >
          <legend className="mb-ns-m text-body text-grayscale-text-title leading-normal font-bold">
            Alasan tutor menolak <span className="text-grayscale-text-negative">*</span>
          </legend>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? null}
                onValueChange={(v) => field.onChange(v)}
                onBlur={field.onBlur}
                /* Mobile: tiap baris 48px; desktop: dua kolom, baris 32px */
                className="gap-0 *:min-h-12 lg:grid-cols-2 lg:gap-x-ns-2xl lg:*:min-h-8"
              >
                {DECLINE_REASONS.map((r) => (
                  <RadioGroupItem
                    key={r.value}
                    value={r.value}
                    label={r.label}
                  />
                ))}
              </RadioGroup>
            )}
          />
          {errors.reason && (
            <FieldError id="reason-error">{errors.reason.message}</FieldError>
          )}
        </fieldset>

        <Field>
          <FieldLabel htmlFor="note" required={reason === "lainnya"}>
            Catatan
          </FieldLabel>
          <Textarea
            id="note"
            maxLength={NOTE_MAX}
            placeholder={`Contoh: ${offer.tutor.shortName} baru menerima jadwal lain di jam yang sama.`}
            aria-invalid={errors.note ? true : undefined}
            aria-describedby={errors.note ? "note-error" : "note-help"}
            {...form.register("note")}
          />
          {errors.note ? (
            <FieldError id="note-error" counter={`${note.length}/${NOTE_MAX}`}>
              {errors.note.message}
            </FieldError>
          ) : (
            <FieldDescription
              id="note-help"
              counter={`${note.length}/${NOTE_MAX}`}
            >
              {reason === "lainnya"
                ? "Wajib diisi untuk alasan Lainnya."
                : "Opsional. Membantu saat memilih tutor berikutnya."}
            </FieldDescription>
          )}
        </Field>
      </form>

      <AlertBanner
        status="info"
        title={`${student} kembali ke daftar pencocokan`}
        description="Anda bisa langsung memilih tutor lain setelah penolakan disimpan."
      />
    </DetailScreen>
  )
}

/* "Penawaran / Ditolak" */
function DeclinedResult({ offer }: { offer: Offer }) {
  const navigate = useNavigate()
  return (
    <ResultScreen
      pageTitle="Penawaran"
      status="warning"
      title="Penolakan tercatat"
      description={`${firstName(offer.student.name)} kembali ke daftar pencocokan. Pilih tutor lain agar les bisa segera dimulai.`}
      footer={
        <>
          <Button
            size="lg"
            className={RESULT_BUTTON_DESKTOP}
            nativeButton={false}
            render={
              <Link to={`${LES}/pencocokan/${offer.registrationId}`} replace />
            }
          >
            Cari Tutor Lain
          </Button>
          <Button
            variant="tertiary"
            onClick={() => navigate(`${LES}?tab=penawaran`, { replace: true })}
          >
            Kembali ke Penawaran
          </Button>
        </>
      }
    >
      <ResultOfferCard offer={offer} />
    </ResultScreen>
  )
}

export { CatatPenolakan }
