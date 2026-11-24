import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, useSearchParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { ResultScreen } from "@/components/layouts/result-screen"
import { AlertBanner } from "@/components/ui/alert-banner"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataState } from "@/components/ui/data-state"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/toast-api"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import {
  billQuery,
  createPayment,
  NotFoundError,
  remainingOf,
  statusOf,
  type Bill,
  type PaymentResult,
} from "@/features/tagihan/api/tagihan"
import { formatPeriod } from "@/features/tagihan/lib/format"
import { formatRupiah } from "@/lib/format/currency"
import { formatDate, formatDateTime } from "@/lib/format/date"

/*
 * W6 · Pembayaran · frame "Pilih nominal" → "Memproses" → "Berhasil -
 * Lunas" / "Berhasil - Sebagian" / "Gagal".
 *
 * Nominal: bayar penuh (sisa tagihan) atau sebagian (min. Rp10.000, maks.
 * sisa tagihan). Pembayaran diteruskan ke payment gateway; selama menunggu
 * konfirmasi tampil layar "Memproses" tanpa top app bar.
 */
const MIN_PARTIAL = 10_000

type Stage =
  | { name: "form" }
  | { name: "processing" }
  | { name: "result"; result: PaymentResult }

function BayarTagihan() {
  const { billId = "" } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const query = useQuery(billQuery(billId))
  const [stage, setStage] = React.useState<Stage>({ name: "form" })

  const pay = useMutation({
    mutationFn: (amount: number) =>
      createPayment(billId, amount, {
        /* Hanya development: ?hasil=gagal mensimulasikan transaksi kedaluwarsa */
        simulateFailure: import.meta.env.DEV && params.get("hasil") === "gagal",
      }),
    networkMode: "always",
    onMutate: () => {
      setStage({ name: "processing" })
      window.scrollTo({ top: 0 })
    },
    onSuccess: (result) => {
      queryClient.setQueryData(billQuery(billId).queryKey, result.bill)
      void queryClient.invalidateQueries({ queryKey: ["tagihan"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setStage({ name: "result", result })
    },
    onError: () => {
      setStage({ name: "form" })
      toast.error("Pembayaran gagal dimulai", {
        description: "Periksa koneksi lalu coba lagi. Tidak ada dana yang ditarik.",
      })
    },
  })

  const backToBills = () => navigate("/wali/tagihan", { replace: true })

  if (stage.name === "processing") {
    return (
      <div className="flex flex-1 flex-col bg-grayscale-surface-default">
      <main className="mx-auto flex w-full max-w-120 flex-1 flex-col items-center justify-center gap-ns-l px-ns-2xl py-ns-3xl">
        <DataState
          state="loading"
          loadingLabel="Memeriksa status pembayaran…"
          aria-live="polite"
        />
        <p className="text-center text-caption leading-normal text-grayscale-text-caption">
          Mohon tunggu, jangan tutup halaman ini. Kami sedang menerima
          konfirmasi dari payment gateway.
        </p>
      </main>
      </div>
    )
  }

  if (stage.name === "result") {
    return (
      <PaymentResultScreen
        result={stage.result}
        onRetry={() => setStage({ name: "form" })}
        onViewBill={() => navigate(`/wali/tagihan/${billId}`, { replace: true })}
        onBack={backToBills}
      />
    )
  }

  if (query.data && remainingOf(query.data) > 0) {
    return (
      <PaymentForm
        bill={query.data}
        submitting={pay.isPending}
        onSubmit={(amount) => pay.mutate(amount)}
      />
    )
  }

  return (
    <DetailScreen title="Pembayaran">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat tagihan…" />
      ) : query.isError && !(query.error instanceof NotFoundError) ? (
        <DataState
          state="error"
          title="Tagihan gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={query.isError ? "Tagihan tidak ditemukan" : "Tagihan sudah lunas"}
          description="Tidak ada sisa tagihan yang perlu dibayar."
          action={{ label: "Kembali ke Tagihan", onClick: backToBills }}
        />
      )}
    </DetailScreen>
  )
}

/* ---------- Pilih nominal ---------- */

const digitsOnly = (value: string) => Number(value.replace(/\D/g, "")) || 0

function PaymentForm({
  bill,
  submitting,
  onSubmit,
}: {
  bill: Bill
  submitting: boolean
  onSubmit: (amount: number) => void
}) {
  const remaining = remainingOf(bill)
  const [mode, setMode] = React.useState<"penuh" | "sebagian">("penuh")
  const [partial, setPartial] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validate = (amount: number) => {
    if (amount === 0) return "Nominal yang dibayar wajib diisi."
    if (amount < MIN_PARTIAL) return `Nominal minimal ${formatRupiah(MIN_PARTIAL)}.`
    if (amount > remaining)
      return `Nominal melebihi sisa tagihan ${formatRupiah(remaining)}.`
    return null
  }

  const handleSubmit = () => {
    if (mode === "penuh") return onSubmit(remaining)
    const message = validate(partial)
    setError(message)
    if (message) inputRef.current?.focus()
    else onSubmit(partial)
  }

  return (
    <DetailScreen
      title="Pembayaran"
      surface="default"
      className="gap-ns-2xl"
      footer={
        <Button onClick={handleSubmit} disabled={submitting}>
          Lanjut ke Pembayaran
        </Button>
      }
    >
      <div className="flex flex-col gap-ns-2xs rounded-(--comp-radius-md) bg-grayscale-surface-subtitle px-ns-l py-ns-m leading-normal">
        <p className="text-caption text-grayscale-text-caption">
          Tagihan {formatPeriod(bill.period)} · {bill.studentName}
        </p>
        <p className="text-body font-bold text-grayscale-text-title">
          Sisa tagihan {formatRupiah(remaining)}
        </p>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-ns-l">
        <legend className="mb-ns-l text-body leading-normal font-bold text-grayscale-text-title">
          Nominal pembayaran
        </legend>
        <RadioGroup
          value={mode}
          onValueChange={(v) => {
            setMode(v as typeof mode)
            setError(null)
            if (v === "sebagian") requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className="gap-ns-l"
        >
          <RadioGroupItem
            value="penuh"
            label={`Bayar penuh · ${formatRupiah(remaining)}`}
          />
          <RadioGroupItem value="sebagian" label="Bayar sebagian" />
        </RadioGroup>

        {mode === "sebagian" && (
          <Field>
            <FieldLabel htmlFor="amount" required>
              Nominal yang dibayar
            </FieldLabel>
            <Input
              id="amount"
              ref={inputRef}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Contoh: Rp200.000"
              value={partial > 0 ? formatRupiah(partial) : ""}
              onChange={(e) => {
                const amount = digitsOnly(e.target.value)
                setPartial(amount)
                if (error) setError(validate(amount))
              }}
              onBlur={() => partial > 0 && setError(validate(partial))}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "amount-error" : undefined}
            />
            {error ? (
              <FieldError id="amount-error">{error}</FieldError>
            ) : (
              <FieldDescription>
                Maksimal {formatRupiah(remaining)} (sisa tagihan). Sisa akan
                tetap tercatat.
              </FieldDescription>
            )}
          </Field>
        )}
      </fieldset>

      <AlertBanner
        status="info"
        title="Pembayaran melalui payment gateway"
        description="Anda akan diarahkan ke halaman pembayaran untuk memilih QRIS, virtual account, atau e-wallet."
      />
    </DetailScreen>
  )
}

/* ---------- Hasil pembayaran ---------- */

function PaymentResultScreen({
  result,
  onRetry,
  onViewBill,
  onBack,
}: {
  result: PaymentResult
  onRetry: () => void
  onViewBill: () => void
  onBack: () => void
}) {
  const { payment, bill } = result
  const period = formatPeriod(bill.period)
  const remaining = remainingOf(bill)
  const backButton = (
    <Button variant="tertiary" onClick={onBack}>
      Kembali ke Tagihan
    </Button>
  )

  if (payment.status !== "berhasil") {
    return (
      <ResultScreen
        status="error"
        title="Pembayaran gagal"
        description="Transaksi kedaluwarsa atau dibatalkan. Tidak ada dana yang ditarik dan status tagihan tidak berubah."
        footer={
          <>
            <Button size="lg" onClick={onRetry}>
              Coba Bayar Lagi
            </Button>
            {backButton}
          </>
        }
      >
        <TransactionCard>
          <SummaryRow label="ID transaksi" align="between">
            {payment.id}
          </SummaryRow>
          <SummaryRow label="Tagihan" align="between">
            {period}
          </SummaryRow>
          <SummaryRow label="Nominal" align="between">
            {formatRupiah(payment.amount)}
          </SummaryRow>
          <SummaryRow label="Status tagihan" align="between">
            <StatusBadge category="pembayaran" status={statusOf(bill)} />
          </SummaryRow>
        </TransactionCard>
      </ResultScreen>
    )
  }

  if (remaining > 0) {
    return (
      <ResultScreen
        title="Pembayaran diterima"
        highlight={formatRupiah(payment.amount)}
        description={`Sisa tagihan ${period} sebesar ${formatRupiah(remaining)} tetap dapat dibayar sebelum ${formatDate(bill.dueDate)}.`}
        footer={
          <>
            <Button size="lg" onClick={onRetry}>
              Bayar Sisa Tagihan
            </Button>
            {backButton}
          </>
        }
      >
        <TransactionCard>
          <SummaryRow label="ID transaksi" align="between">
            {payment.id}
          </SummaryRow>
          <SummaryRow label="Metode" align="between">
            {payment.method}
          </SummaryRow>
          <SummaryRow label="Sisa tagihan" align="between">
            {formatRupiah(remaining)}
          </SummaryRow>
          <SummaryRow label="Status tagihan" align="between">
            <StatusBadge category="pembayaran" status={statusOf(bill)} />
          </SummaryRow>
        </TransactionCard>
      </ResultScreen>
    )
  }

  return (
    <ResultScreen
      title="Pembayaran berhasil"
      highlight={formatRupiah(payment.amount)}
      description={`Tagihan ${period} untuk ${bill.studentName} sudah lunas.`}
      footer={
        <>
          <Button size="lg" onClick={onViewBill}>
            Lihat Detail Tagihan
          </Button>
          {backButton}
        </>
      }
    >
      <TransactionCard>
        <SummaryRow label="ID transaksi" align="between">
          {payment.id}
        </SummaryRow>
        <SummaryRow label="Metode" align="between">
          {payment.method}
        </SummaryRow>
        <SummaryRow label="Waktu" align="between">
          {formatDateTime(payment.createdAt)}
        </SummaryRow>
        <SummaryRow label="Status tagihan" align="between">
          <StatusBadge category="pembayaran" status="lunas" />
        </SummaryRow>
      </TransactionCard>
    </ResultScreen>
  )
}

function TransactionCard({ children }: { children: React.ReactNode }) {
  return (
    <Card size="compact" className="w-full text-left">
      <CardHeader>
        <CardTitle>Rincian Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-ns-m">{children}</dl>
      </CardContent>
    </Card>
  )
}

export { BayarTagihan }
