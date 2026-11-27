import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormProvider, useForm } from "react-hook-form"
import { useNavigate } from "react-router"

import {
  DetailScreen,
  AlertBanner,
  Button,
  ProgressStepper,
  Timeline,
  TimelineItem,
  toast,
} from "@/components"
import {
  alreadyRegisteredIdOf,
  pendaftaranDefaultsQuery,
  submitPendaftaran,
} from "@/features/pendaftaran/api"
import { applyFieldErrors, getErrorMessage, isApiError } from "@/lib/api"
import type { PendaftaranResult } from "@/types/pendaftaran"
import {
  PendaftaranBerhasil,
  StepDataSiswa,
  StepJadwalBelajar,
  StepKebutuhanBelajar,
  StepRingkasan,
} from "@/features/pendaftaran/components"

import {
  EMPTY_PENDAFTARAN,
  pendaftaranSchema,
  STEP_FIELDS,
  type PendaftaranInput,
} from "@/features/pendaftaran/schemas"

/*
 * W2 · Pendaftaran Siswa · Figma PINTARA → UI Screen → Wali Murid
 *
 * Alur 4 langkah dalam satu form (data tetap tersimpan saat berpindah
 * langkah): Data Wali & Siswa → Kebutuhan Belajar → Jadwal Belajar →
 * Ringkasan → layar Berhasil.
 *
 * State error sesuai frame Figma:
 *   Field wajib kosong   → banner "Lengkapi n data wajib" + field merah
 *   Siswa sudah terdaftar → banner + aksi "Lihat status pendaftaran";
 *                           bilah aksi menjadi Kembali / Batalkan Pendaftaran
 *   Validasi BE (422)     → error per field, pindah ke langkah field tsb.
 *   Gagal mengirim        → toast error, data tetap di formulir
 *
 * Desktop (≥ lg, frame "… (Desktop)"): Page header (kembali "Beranda" +
 *   judul H3), Progress stepper diganti judul langkah "Langkah n dari 4" +
 *   nama langkah (Headline) di kolom formulir; tombol rata kanan di bawah
 *   garis pemisah pada akhir kolom formulir. Kolom samping 300px bergaris
 *   kiri berisi timeline "Langkah pendaftaran".
 */
const STEP_NAMES = [
  "Data Wali & Siswa",
  "Kebutuhan Belajar",
  "Jadwal Belajar",
  "Ringkasan",
] as const

/* Keterangan tiap langkah di timeline "Langkah pendaftaran" (desktop) */
const STEP_DESCRIPTIONS = [
  "Identitas wali dan siswa",
  "Mata pelajaran dan frekuensi les",
  "Hari dan jam yang diinginkan",
  "Periksa data, lalu kirim",
] as const

const LAST_STEP = STEP_NAMES.length - 1

const FORM_FIELDS = Object.keys(EMPTY_PENDAFTARAN) as (keyof PendaftaranInput)[]

function PendaftaranSiswa() {
  const navigate = useNavigate()
  const [step, setStep] = React.useState(0)
  /* Langkah yang sudah dicoba dilanjutkan, untuk menampilkan banner error */
  const [attempted, setAttempted] = React.useState<Set<number>>(new Set())
  /* Diisi ID pendaftaran aktif yang sudah ada (error "Siswa sudah terdaftar") */
  const [existingId, setExistingId] = React.useState<string | null>(null)
  const alreadyRegistered = existingId != null
  const [result, setResult] = React.useState<PendaftaranResult | null>(null)

  const queryClient = useQueryClient()
  const defaults = useQuery(pendaftaranDefaultsQuery())

  const form = useForm<PendaftaranInput>({
    resolver: zodResolver(pendaftaranSchema),
    mode: "onTouched",
    defaultValues: EMPTY_PENDAFTARAN,
    /* Isi data wali dari akun tanpa menimpa yang sudah diketik pengguna */
    values: defaults.data
      ? { ...EMPTY_PENDAFTARAN, ...defaults.data }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  })
  const { errors } = form.formState

  const goTo = (next: number) => {
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  const submit = useMutation({
    mutationFn: submitPendaftaran,
    /* Saat offline langsung gagal (toast) alih-alih menunggu koneksi diam-diam */
    networkMode: "always",
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ["pendaftaran", "status"],
      })
      setResult(data)
      window.scrollTo({ top: 0 })
    },
    onError: (error) => {
      const existing = alreadyRegisteredIdOf(error)
      if (existing != null) {
        setExistingId(existing)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
      if (
        isApiError(error) &&
        applyFieldErrors(error, form.setError, FORM_FIELDS)
      ) {
        const target = STEP_FIELDS.findIndex((fields) =>
          fields.some((name) => name in error.fieldErrors)
        )
        setAttempted((prev) => {
          const next = new Set(prev)
          next.delete(target)
          return next
        })
        goTo(target)
        toast.error("Pendaftaran belum dapat dikirim", {
          description: "Periksa kembali data yang ditandai merah.",
        })
        return
      }
      toast.error("Pendaftaran gagal dikirim", {
        description: `${getErrorMessage(error)} Data Anda tetap tersimpan di formulir.`,
      })
    },
  })

  const handleNext = async () => {
    setAttempted((prev) => new Set(prev).add(step))
    const valid = await form.trigger([...STEP_FIELDS[step]], {
      shouldFocus: true,
    })
    if (valid) goTo(step + 1)
  }

  const handleBack = () => {
    if (step === 0) navigate(-1)
    else {
      setExistingId(null)
      goTo(step - 1)
    }
  }

  const handleSubmit = form.handleSubmit((values) => {
    setExistingId(null)
    submit.mutate(values)
  })

  if (result) return <PendaftaranBerhasil result={result} />

  const missingCount = STEP_FIELDS[step].filter((name) => errors[name]).length
  const showMissingBanner = attempted.has(step) && missingCount > 0

  /* `key` agar fokus/hover tombol tidak terbawa ke tombol lain saat berganti langkah */
  const footer = (
    <>
      {step > 0 && (
        <Button key="kembali" variant="secondary" onClick={handleBack}>
          Kembali
        </Button>
      )}
      {step < LAST_STEP ? (
        <Button key="lanjut" onClick={handleNext}>
          Lanjut
        </Button>
      ) : alreadyRegistered ? (
        <Button
          key="batalkan"
          onClick={() => navigate("/", { replace: true })}
        >
          Batalkan Pendaftaran
        </Button>
      ) : (
        <Button key="kirim" onClick={handleSubmit} disabled={submit.isPending}>
          {submit.isPending ? "Mengirim…" : "Kirim Pendaftaran"}
        </Button>
      )}
    </>
  )

  return (
    <DetailScreen
      title="Daftar Siswa Baru"
      surface="default"
      onBack={handleBack}
      desktopHeader="page"
      backLabel="Beranda"
      desktopWidth="wide"
      desktopActions="none"
      desktopSubheader="hidden"
      subheader={
        <ProgressStepper
          step={step + 1}
          totalSteps={STEP_NAMES.length}
          stepName={STEP_NAMES[step]}
        />
      }
      footer={footer}
      className="gap-ns-2xl pt-ns-2xl lg:flex-1 lg:pt-ns-3xl lg:pb-ns-4xl"
    >
      <div className="contents lg:grid lg:flex-1 lg:grid-cols-[minmax(0,1fr)_18.75rem] lg:gap-ns-4xl">
        <FormProvider {...form}>
          <form
            noValidate
            aria-label="Formulir pendaftaran siswa"
            onSubmit={(e) => e.preventDefault()}
            className="contents lg:flex lg:flex-col lg:gap-ns-3xl"
          >
            <div className="hidden flex-col gap-ns-2xs font-bold lg:flex">
              <p className="text-subtitle leading-normal text-primary-text-primary">
                Langkah {step + 1} dari {STEP_NAMES.length}
              </p>
              <h2 className="text-headline text-grayscale-text-title">
                {STEP_NAMES[step]}
              </h2>
            </div>

            {showMissingBanner && (
              <AlertBanner
                status="error"
                title={
                  missingCount > 1
                    ? `Lengkapi ${missingCount} data wajib`
                    : "Lengkapi data wajib"
                }
                description="Data yang belum diisi ditandai merah. Data lain yang sudah diisi tetap tersimpan."
              />
            )}
            {step === LAST_STEP && alreadyRegistered && (
              <AlertBanner
                status="error"
                title="Siswa sudah terdaftar"
                description={`${form.getValues("studentName")} (${form.getValues("grade")}) sudah memiliki pendaftaran aktif. Data tidak disimpan.`}
                action={{
                  label: "Lihat status pendaftaran",
                  onClick: () =>
                    navigate(
                      existingId
                        ? `/wali/pendaftaran/status?id=${encodeURIComponent(existingId)}`
                        : "/wali/pendaftaran/status"
                    ),
                }}
              />
            )}

            {step === 0 && <StepDataSiswa />}
            {step === 1 && <StepKebutuhanBelajar />}
            {step === 2 && <StepJadwalBelajar />}
            {step === 3 && <StepRingkasan showIntro={!alreadyRegistered} />}

            <div className="mt-auto hidden justify-end gap-ns-m border-t border-grayscale-border-default pt-ns-2xl lg:flex">
              {footer}
            </div>
          </form>
        </FormProvider>

        <aside
          aria-labelledby="langkah-pendaftaran"
          className="hidden flex-col gap-ns-l border-l border-grayscale-border-default pl-ns-4xl lg:flex"
        >
          <h2
            id="langkah-pendaftaran"
            className="text-body leading-normal font-bold text-grayscale-text-title"
          >
            Langkah pendaftaran
          </h2>
          <Timeline>
            {STEP_NAMES.map((name, i) => (
              <TimelineItem
                key={name}
                state={i < step ? "done" : i === step ? "current" : "upcoming"}
                title={name}
                description={STEP_DESCRIPTIONS[i]}
              />
            ))}
          </Timeline>
        </aside>
      </div>
    </DetailScreen>
  )
}

export { PendaftaranSiswa }
