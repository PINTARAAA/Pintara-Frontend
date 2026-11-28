import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, isAfter, startOfDay } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useNavigate, useParams } from "react-router"

import {
  DetailScreen,
  Button,
  DataState,
  DatePicker,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileUpload,
  type UploadStatus,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@/components"
import {
  billRemaining,
  billStatus,
  MANUAL_METHODS,
  isReportNotFoundError,
  recordManualPayment,
  studentBillQuery,
} from "@/features/keuangan/api"
import type { ManualMethod, StudentBill } from "@/types/keuangan"
import { DOC_ACCEPT, validateDocumentation } from "@/features/presensi/api"
import { getErrorMessage } from "@/lib/api"
import { formatRupiah } from "@/lib/format"

/*
 * P8 · Catat Pembayaran Manual · Figma "Laporan Keuangan / Catat pembayaran
 * manual".
 *
 * Ringkasan (siswa · tagihan bulan, sisa tagihan) → Nominal diterima (maks.
 * sisa; kurang dari sisa = Dibayar Sebagian) → Tanggal pembayaran (maks.
 * hari ini) → Metode (Tunai di LBB / Transfer bank) → Bukti pembayaran
 * (opsional; JPG/PNG/PDF maks. 5 MB). Setelah tersimpan kembali ke Rincian
 * Tagihan dengan toast.
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

function CatatPembayaranTagihan() {
  const { billId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(studentBillQuery(billId))

  if (query.data && billStatus(query.data) !== "lunas") {
    return <PaymentForm bill={query.data} />
  }

  return (
    <DetailScreen
      title="Catat Pembayaran"
      backLabel="Rincian Tagihan"
      desktopHeader="page"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat tagihan…" />
      ) : query.isError && !isReportNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Tagihan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError ? "Tagihan tidak ditemukan" : "Tagihan sudah lunas"
          }
          description="Pembayaran hanya bisa dicatat untuk tagihan yang belum lunas."
          action={{
            label: "Kembali ke Laporan Keuangan",
            onClick: () =>
              navigate("/pengelola/laporan-keuangan", { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

type Errors = Partial<Record<"amount" | "date" | "file", string>>

function PaymentForm({ bill }: { bill: StudentBill }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const remaining = billRemaining(bill)

  const [amount, setAmount] = React.useState(remaining)
  const [paidAt, setPaidAt] = React.useState<Date | null>(new Date())
  const [method, setMethod] = React.useState<ManualMethod>("Tunai di LBB")
  const [doc, setDoc] = React.useState<DocState>(EMPTY_DOC)
  const [errors, setErrors] = React.useState<Errors>({})

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }))

  /* BE hanya mencatat nama & ukuran bukti, jadi file cukup divalidasi di sini */
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
    if (amount <= 0) next.amount = "Nominal diterima wajib diisi."
    else if (amount > remaining)
      next.amount = `Nominal melebihi sisa tagihan ${formatRupiah(remaining)}.`
    if (!paidAt) next.date = "Pilih tanggal pembayaran."
    else if (isAfter(startOfDay(paidAt), startOfDay(new Date())))
      next.date = "Tanggal pembayaran tidak boleh di masa depan."
    /* Bukti opsional, tetapi unggahan yang berjalan/gagal harus dibereskan */
    if (doc.status === "uploading")
      next.file = "Tunggu hingga file selesai diunggah."
    else if (doc.status === "error") next.file = doc.error ?? "Unggahan gagal."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = useMutation({
    mutationFn: () =>
      recordManualPayment(bill.id, {
        amount,
        paidAt: paidAt ?? new Date(),
        method,
        proof:
          doc.file && doc.status === "success"
            ? { name: doc.file.name, size: doc.file.size }
            : undefined,
      }),
    networkMode: "always",
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["laporan-keuangan"] })
      const status = billStatus(updated)
      toast.success("Pembayaran tercatat", {
        description: `Tagihan ${bill.studentName} sekarang ${status === "lunas" ? "Lunas" : `Dibayar Sebagian, sisa ${formatRupiah(billRemaining(updated))}`}.`,
      })
      /* Kembali ke Rincian Tagihan (layar sebelumnya) */
      navigate(-1)
    },
    onError: (error) => {
      /* Sisa tagihan mungkin sudah berubah (mis. 422 nominal tidak valid) */
      void queryClient.invalidateQueries({
        queryKey: studentBillQuery(bill.id).queryKey,
      })
      toast.error("Pembayaran gagal dicatat", {
        /* Pesan BE tidak selalu diakhiri titik */
        description: `${getErrorMessage(error).replace(/\.?$/, ".")} Isian Anda tetap tersimpan.`,
      })
    },
  })

  return (
    <DetailScreen
      title="Catat Pembayaran"
      backLabel="Rincian Tagihan"
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
            {save.isPending ? "Menyimpan…" : "Simpan Pembayaran"}
          </Button>
        </>
      }
    >
      <div className="gap-ns-2xs bg-grayscale-surface-subtitle px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) leading-normal">
        <p className="text-caption text-grayscale-text-caption">
          {bill.studentName} · Tagihan {monthLabel(bill.period)}
        </p>
        <p className="text-body text-grayscale-text-title font-bold">
          Sisa tagihan {formatRupiah(remaining)}
        </p>
      </div>

      <form
        noValidate
        aria-label="Formulir pembayaran tagihan"
        onSubmit={(e) => e.preventDefault()}
        /* Desktop: nominal · tanggal · metode di kiri, bukti di kanan */
        className="gap-ns-2xl lg:gap-x-ns-4xl flex flex-col lg:grid lg:grid-cols-2 lg:items-start"
      >
        <div className="lg:gap-ns-2xl contents lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
          <Field>
            <FieldLabel htmlFor="amount" required>
              Nominal diterima
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
                Maksimal sisa tagihan. Kurang dari sisa akan tercatat Dibayar
                Sebagian.
              </FieldDescription>
            )}
          </Field>

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
            <FieldLabel htmlFor="method" required>
              Metode
            </FieldLabel>
            <Select
              items={MANUAL_METHODS.map((m) => ({ value: m, label: m }))}
              value={method}
              onValueChange={(v) => v && setMethod(v as ManualMethod)}
            >
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="p-0">
                  {MANUAL_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <FileUpload
          className="lg:col-start-2 lg:row-start-1"
          id="proof"
          label="Bukti pembayaran"
          accept={DOC_ACCEPT}
          helper="JPG, PNG, atau PDF · maks. 5 MB"
          file={doc.file}
          status={doc.status}
          progress={doc.progress}
          error={doc.status === "error" ? doc.error : errors.file}
          onSelect={selectFile}
          onRemove={() => {
            setDoc(EMPTY_DOC)
            clear("file")
          }}
        />
      </form>
    </DetailScreen>
  )
}

export { CatatPembayaranTagihan }
