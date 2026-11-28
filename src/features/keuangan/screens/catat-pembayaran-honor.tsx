import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, isAfter, startOfDay } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  ResultScreen,
  RESULT_BUTTON_DESKTOP,
  AlertBanner,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  DatePicker,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileUpload,
  type UploadStatus,
  Input,
  RadioGroup,
  RadioGroupItem,
  toast,
} from "@/components"
import {
  honorDetailQuery,
  METHOD_LABEL,
  isHonorNotFoundError,
  recordHonorPayment,
} from "@/features/keuangan/api"
import type { HonorDetail, HonorPaymentMethod } from "@/types/keuangan"
import { SummaryRow } from "@/features/pendaftaran/components"
import { DOC_ACCEPT, validateDocumentation } from "@/features/presensi/api"
import { getErrorMessage } from "@/lib/api"
import { formatRupiah, formatDate } from "@/lib/format"

/*
 * P7 · Catat Pembayaran Honor · Figma "Honor / Catat pembayaran" dan
 * "Honor / Tersimpan".
 *
 * Ringkasan (tutor · bulan, total honor) → Metode pengambilan (Radio) →
 * Tanggal pembayaran (maks. hari ini) → Nominal dibayar (maks. total; kurang
 * dari total = Sebagian) → Bukti pembayaran (JPG/PNG/PDF, maks. 5 MB) →
 * banner "Hanya pencatatan". Setelah tersimpan tampil layar hasil.
 *
 * Desktop (Figma "Honor / … (Desktop)"): Page header "← Rincian Honor";
 * dua kolom sama lebar (jarak 40): metode (radio berdampingan) · tanggal ·
 * nominal di kiri, bukti pembayaran + banner di kanan; Batal (khusus
 * desktop) · Simpan Pembayaran rata kanan di bawah garis pemisah.
 * Tersimpan: Page header "Catat Pembayaran", hasil di tengah.
 */
const monthLabel = (d: Date) => format(d, "MMMM yyyy", { locale: localeId })
const digitsOnly = (value: string) => Number(value.replace(/\D/g, "")) || 0

type DocState = {
  file: File | null
  status: UploadStatus
  progress: number
  error: string | null
}
const EMPTY_DOC: DocState = {
  file: null,
  status: "idle",
  progress: 0,
  error: null,
}

function CatatPembayaranHonor() {
  const { month = "", tutorId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(honorDetailQuery(month, tutorId))
  const [saved, setSaved] = React.useState<HonorDetail | null>(null)

  if (saved) return <PaymentSaved honor={saved} />
  if (query.data && query.data.status !== "lunas") {
    return <PaymentForm honor={query.data} onSaved={setSaved} />
  }

  return (
    <DetailScreen
      title="Catat Pembayaran"
      backLabel="Rincian Honor"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat honor…" />
      ) : query.isError && !isHonorNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Honor gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={query.isError ? "Honor tidak ditemukan" : "Honor sudah lunas"}
          description="Pembayaran hanya bisa dicatat untuk honor yang belum lunas."
          action={{
            label: "Kembali ke Keuangan",
            onClick: () => navigate("/pengelola/keuangan", { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

type Errors = Partial<Record<"date" | "amount" | "file", string>>

function PaymentForm({
  honor,
  onSaved,
}: {
  honor: HonorDetail
  onSaved: (honor: HonorDetail) => void
}) {
  const { month = "", tutorId = "" } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const remaining = honor.total - (honor.payment?.amount ?? 0)

  const [method, setMethod] = React.useState<HonorPaymentMethod>(honor.method)
  const [paidAt, setPaidAt] = React.useState<Date | null>(new Date())
  const [amount, setAmount] = React.useState(remaining)
  const [doc, setDoc] = React.useState<DocState>(EMPTY_DOC)
  const [errors, setErrors] = React.useState<Errors>({})

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }))

  /* File divalidasi di sini dan diunggah bersama data pembayaran saat simpan */
  const selectFile = (file: File) => {
    const invalid = validateDocumentation(file)
    if (invalid) {
      setDoc({ file, status: "error", progress: 0, error: invalid })
      return
    }
    clear("file")
    setDoc({ file, status: "success", progress: 100, error: null })
  }

  const validate = () => {
    const next: Errors = {}
    if (!paidAt) next.date = "Pilih tanggal pembayaran."
    else if (isAfter(startOfDay(paidAt), startOfDay(new Date())))
      next.date = "Tanggal pembayaran tidak boleh di masa depan."
    if (amount <= 0) next.amount = "Nominal dibayar wajib diisi."
    else if (amount > remaining)
      next.amount = `Nominal melebihi sisa honor ${formatRupiah(remaining)}.`
    if (doc.status === "idle") next.file = "Unggah bukti pembayaran."
    else if (doc.status === "uploading")
      next.file = "Tunggu hingga file selesai diunggah."
    else if (doc.status === "error") next.file = doc.error ?? "Unggahan gagal."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = useMutation({
    mutationFn: (proof: File) => {
      /* Progres unggah bukti tampil di kotak file selama menyimpan */
      setDoc((d) => ({ ...d, status: "uploading", progress: 0 }))
      return recordHonorPayment(
        month,
        tutorId,
        {
          method,
          paidAt: paidAt ?? new Date(),
          amount: amount + (honor.payment?.amount ?? 0),
          proof,
        },
        (progress) => setDoc((d) => ({ ...d, progress }))
      )
    },
    networkMode: "always",
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["honor"] })
      void queryClient.invalidateQueries({ queryKey: ["laporan-keuangan"] })
      onSaved(updated)
    },
    onError: (error) => {
      setDoc((d) => ({ ...d, status: "success", progress: 100 }))
      toast.error("Pembayaran gagal dicatat", {
        /* Pesan BE tidak selalu diakhiri titik */
        description: `${getErrorMessage(error).replace(/\.?$/, ".")} Isian Anda tetap tersimpan.`,
      })
    },
  })

  return (
    <DetailScreen
      title="Catat Pembayaran"
      backLabel="Rincian Honor"
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
            onClick={() => {
              if (validate() && doc.file) save.mutate(doc.file)
            }}
            disabled={save.isPending}
          >
            {save.isPending ? "Menyimpan…" : "Simpan Pembayaran"}
          </Button>
        </>
      }
    >
      <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
        <p className="text-caption text-grayscale-text-caption">
          {honor.name} · {monthLabel(honor.month)}
        </p>
        <p className="text-body text-grayscale-text-title font-bold">
          {honor.payment ? "Sisa honor" : "Total honor"}{" "}
          {formatRupiah(remaining)}
        </p>
      </div>

      <form
        noValidate
        aria-label="Formulir pembayaran honor"
        onSubmit={(e) => e.preventDefault()}
        className="gap-ns-2xl lg:gap-x-ns-4xl flex flex-col lg:grid lg:grid-cols-2 lg:items-start"
      >
        <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-ns-2xl">
          <fieldset className="gap-ns-m flex flex-col">
            <legend className="mb-ns-m text-body text-grayscale-text-title leading-normal font-bold">
              Metode pengambilan <span className="text-grayscale-text-negative">*</span>
            </legend>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as HonorPaymentMethod)}
              /* Mobile: tiap baris 48px; desktop: dua pilihan berdampingan */
              className="gap-0 *:min-h-12 lg:grid-cols-2 lg:gap-x-ns-2xl lg:*:min-h-8"
            >
              <RadioGroupItem
                value="tunai"
                label="Tunai · diambil langsung di LBB"
              />
              <RadioGroupItem value="transfer" label="Transfer bank" />
            </RadioGroup>
          </fieldset>

          <Field>
            <FieldLabel htmlFor="paid-at" required>
              Tanggal pembayaran
            </FieldLabel>
            <DatePicker
              id="paid-at"
              value={paidAt}
              onValueChange={(d) => {
                setPaidAt(d)
                clear("date")
              }}
              invalid={!!errors.date}
              calendarProps={{ disabled: { after: new Date() } }}
            />
            {errors.date && <FieldError>{errors.date}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="amount" required>
              Nominal dibayar
            </FieldLabel>
            <Input
              id="amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder={`Contoh: ${formatRupiah(remaining)}`}
              value={amount > 0 ? formatRupiah(amount) : ""}
              onChange={(e) => {
                setAmount(digitsOnly(e.target.value))
                clear("amount")
              }}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? "amount-error" : "amount-help"}
            />
            {errors.amount ? (
              <FieldError id="amount-error">{errors.amount}</FieldError>
            ) : (
              <FieldDescription id="amount-help">
                {amount > 0 && amount < remaining
                  ? `Tercatat sebagai pembayaran sebagian, sisa ${formatRupiah(remaining - amount)}.`
                  : `Sesuai ${honor.payment ? "sisa" : "total"} honor ${formatRupiah(remaining)}.`}
              </FieldDescription>
            )}
          </Field>
        </div>

        <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-ns-2xl">
          <FileUpload
            id="proof"
            label="Bukti pembayaran"
            required
            accept={DOC_ACCEPT}
            helper="JPG, PNG, atau PDF · maks. 5 MB"
            file={doc.file}
            status={doc.status}
            progress={doc.progress}
            error={doc.status === "error" ? doc.error : errors.file}
            onSelect={selectFile}
            onRemove={() => setDoc(EMPTY_DOC)}
          />

          <AlertBanner
            status="info"
            title="Hanya pencatatan"
            description="PINTARA tidak mentransfer dana. Pembayaran tetap dilakukan di luar aplikasi."
          />
        </div>
      </form>
    </DetailScreen>
  )
}

/* "Honor / Tersimpan" */
function PaymentSaved({ honor }: { honor: HonorDetail }) {
  const navigate = useNavigate()
  const payment = honor.payment!
  return (
    <ResultScreen
      pageTitle="Catat Pembayaran"
      title="Pembayaran honor tercatat"
      description={`Status honor ${honor.shortName} untuk ${monthLabel(honor.month)} sekarang ${honor.status === "lunas" ? "Dibayar" : "Dibayar sebagian"}.`}
      footer={
        <Button
          size="lg"
          className={RESULT_BUTTON_DESKTOP}
          onClick={() =>
            navigate(
              `/pengelola/keuangan?bulan=${format(honor.month, "yyyy-MM")}`,
              {
                replace: true,
              }
            )
          }
        >
          Kembali ke Rekap Honor
        </Button>
      }
    >
      <Card size="compact" className="w-full">
        <CardHeader>
          <CardTitle>Rincian pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="gap-ns-m flex flex-col">
            <SummaryRow label="Nominal" align="between">
              {formatRupiah(payment.amount)}
            </SummaryRow>
            <SummaryRow label="Metode" align="between">
              {METHOD_LABEL[payment.method]}
            </SummaryRow>
            <SummaryRow label="Tanggal" align="between">
              {formatDate(payment.paidAt)}
            </SummaryRow>
            <SummaryRow label="Bukti" align="between">
              <span className="break-all">{payment.proof.name}</span>
            </SummaryRow>
            <SummaryRow label="Status" align="between">
              <StatusBadge category="pembayaran" status={honor.status} />
            </SummaryRow>
          </dl>
        </CardContent>
      </Card>
    </ResultScreen>
  )
}

export { CatatPembayaranHonor }
