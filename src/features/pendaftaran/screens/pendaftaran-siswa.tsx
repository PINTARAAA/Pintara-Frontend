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
  toast,
} from "@/components"
import {
  PendaftaranError,
  pendaftaranDefaultsQuery,
  submitPendaftaran,
  type PendaftaranResult,
} from "@/features/pendaftaran/api"
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
 *   Gagal mengirim        → toast error, data tetap di formulir
 */
const STEP_NAMES = [
  "Data Wali & Siswa",
  "Kebutuhan Belajar",
  "Jadwal Belajar",
  "Ringkasan",
] as const

const LAST_STEP = STEP_NAMES.length - 1

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

  const submit = useMutation({
    mutationFn: submitPendaftaran,
    /* Saat offline langsung gagal (toast) alih-alih menunggu koneksi diam-diam */
    networkMode: "always",
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["pendaftaran", "status"] })
      setResult(data)
      window.scrollTo({ top: 0 })
    },
    onError: (error) => {
      if (error instanceof PendaftaranError) {
        setExistingId(error.registrationId ?? "")
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        toast.error("Pendaftaran gagal dikirim", {
          description:
            "Data Anda tetap tersimpan di formulir. Periksa koneksi lalu coba lagi.",
        })
      }
    },
  })

  const goTo = (next: number) => {
    setStep(next)
    window.scrollTo({ top: 0 })
  }

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
          onClick={() => navigate("/wali", { replace: true })}
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
      subheader={
        <ProgressStepper
          step={step + 1}
          totalSteps={STEP_NAMES.length}
          stepName={STEP_NAMES[step]}
        />
      }
      footer={footer}
      className="gap-ns-2xl pt-ns-2xl"
    >
      <FormProvider {...form}>
        <form
          noValidate
          aria-label="Formulir pendaftaran siswa"
          onSubmit={(e) => e.preventDefault()}
          className="contents"
        >
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
        </form>
      </FormProvider>
    </DetailScreen>
  )
}

export { PendaftaranSiswa }
