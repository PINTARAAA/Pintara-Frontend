import { isAxiosError, isCancel } from "axios"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

/*
 * Satu bentuk error untuk seluruh aplikasi.
 *
 * Semua kegagalan request (respons error dari server, timeout, koneksi
 * putus, request dibatalkan) diubah oleh interceptor `httpClient` menjadi
 * `ApiError`, sehingga screen cukup memeriksa `error.code` tanpa perlu tahu
 * detail axios atau format respons backend.
 *
 *   code        kategori error (lihat ApiErrorCode)
 *   status      kode HTTP; 0 bila tidak ada respons (offline/timeout)
 *   message     pesan siap tampil (Bahasa Indonesia)
 *   fieldErrors pesan per field dari validasi server, mis. { email: "…" }
 *   serverCode  kode error asli dari backend bila dikirim, mis. "EMAIL_TAKEN"
 */

export type ApiErrorCode =
  | "network"
  | "timeout"
  | "canceled"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limited"
  | "server"
  | "unknown"

export const DEFAULT_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  network: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
  timeout: "Server terlalu lama merespons. Coba lagi beberapa saat lagi.",
  canceled: "Permintaan dibatalkan.",
  bad_request: "Permintaan tidak valid.",
  unauthorized: "Sesi Anda telah berakhir. Silakan masuk kembali.",
  forbidden: "Anda tidak memiliki akses untuk melakukan tindakan ini.",
  not_found: "Data tidak ditemukan.",
  conflict: "Data bentrok dengan data yang sudah ada.",
  validation: "Periksa kembali data yang Anda isi.",
  rate_limited: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
  server: "Terjadi kendala pada server. Coba lagi beberapa saat lagi.",
  unknown: "Terjadi kendala. Coba lagi.",
}

type ApiErrorOptions = {
  status?: number
  message?: string
  fieldErrors?: Record<string, string>
  serverCode?: string
  cause?: unknown
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly serverCode?: string

  constructor(code: ApiErrorCode, options: ApiErrorOptions = {}) {
    super(options.message ?? DEFAULT_ERROR_MESSAGES[code], {
      cause: options.cause,
    })
    this.name = "ApiError"
    this.code = code
    this.status = options.status ?? 0
    this.fieldErrors = options.fieldErrors ?? {}
    this.serverCode = options.serverCode
  }

  get hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError

/* ---------- Pemetaan status HTTP ---------- */

export function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "bad_request"
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404) return "not_found"
  if (status === 409) return "conflict"
  if (status === 422) return "validation"
  if (status === 429) return "rate_limited"
  if (status >= 500) return "server"
  return "unknown"
}

/* ---------- Membaca body error dari backend ---------- */

/*
 * Format body error backend belum final, jadi pembacaan dibuat longgar dan
 * mendukung format umum berikut:
 *   { message: "…" }                                   umum
 *   { error: "…" } / { error: { message, code } }      Express/Nest
 *   { errors: { email: ["…"] } }                       Laravel
 *   { errors: [{ field|path|param: "email", message|msg: "…" }] }
 *   { code: "EMAIL_TAKEN" }                            kode error backend
 * Sesuaikan fungsi ini setelah format backend disepakati.
 */

type ParsedBody = {
  message?: string
  fieldErrors: Record<string, string>
  serverCode?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined

function firstMessage(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstMessage(value[0])
  if (isRecord(value)) return nonEmpty(value.message) ?? nonEmpty(value.msg)
  return nonEmpty(value)
}

function parseFieldErrors(errors: unknown): Record<string, string> {
  const result: Record<string, string> = {}

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (!isRecord(item)) continue
      const rawField = item.field ?? item.path ?? item.param ?? item.property
      const field = Array.isArray(rawField)
        ? rawField.join(".")
        : nonEmpty(rawField)
      const message = firstMessage(item)
      if (field && message && !(field in result)) result[field] = message
    }
  } else if (isRecord(errors)) {
    for (const [field, value] of Object.entries(errors)) {
      const message = firstMessage(value)
      if (message) result[field] = message
    }
  }

  return result
}

export function parseErrorBody(data: unknown): ParsedBody {
  if (typeof data === "string") {
    /* Hindari menampilkan halaman HTML error (mis. dari proxy/nginx) */
    const looksLikeHtml = /^\s*</.test(data)
    return {
      message: looksLikeHtml ? undefined : nonEmpty(data)?.slice(0, 300),
      fieldErrors: {},
    }
  }
  if (!isRecord(data)) return { fieldErrors: {} }

  const nested = isRecord(data.error) ? data.error : undefined
  const fieldErrors = parseFieldErrors(
    data.errors ?? nested?.errors ?? nested?.details
  )

  return {
    message:
      nonEmpty(data.message) ??
      nonEmpty(data.error) ??
      nonEmpty(nested?.message) ??
      /* Tanpa pesan umum: pakai pesan validasi pertama */
      Object.values(fieldErrors)[0],
    fieldErrors,
    serverCode: nonEmpty(data.code) ?? nonEmpty(nested?.code),
  }
}

/* ---------- Normalisasi ---------- */

/*
 * Ubah error apa pun menjadi ApiError. Dipakai interceptor `httpClient`,
 * tetapi aman juga dipanggil langsung untuk error dari sumber lain.
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (isCancel(error)) {
    return new ApiError("canceled", { cause: error })
  }

  if (isAxiosError(error)) {
    const response = error.response

    /* Tidak ada respons: timeout atau koneksi gagal */
    if (!response) {
      const timedOut =
        error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
      if (timedOut) return new ApiError("timeout", { cause: error })
      return new ApiError("network", { cause: error })
    }

    const code = codeFromStatus(response.status)
    const body = parseErrorBody(response.data)

    return new ApiError(code, {
      status: response.status,
      /*
       * Pesan 5xx dari server sering berisi detail teknis, jadi pengguna
       * selalu melihat pesan umum; detail asli tetap ada di `cause`.
       */
      message: code === "server" ? undefined : body.message,
      fieldErrors: body.fieldErrors,
      serverCode: body.serverCode,
      cause: error,
    })
  }

  if (error instanceof Error) {
    return new ApiError("unknown", { message: error.message, cause: error })
  }

  return new ApiError("unknown", { cause: error })
}

/* ---------- Utilitas untuk UI ---------- */

/* Pesan siap tampil untuk toast/banner dari error apa pun */
export function getErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGES.unknown
): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/*
 * Teruskan error validasi server ke react-hook-form agar pesan tampil di
 * bawah field masing-masing. Mengembalikan true bila ada field yang diisi;
 * bila false, tampilkan `getErrorMessage(error)` sebagai banner/toast.
 *
 *   catch (error) {
 *     if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error))
 *   }
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields?: readonly Path<T>[]
): boolean {
  if (!isApiError(error) || !error.hasFieldErrors) return false

  let applied = false
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if (fields && !fields.includes(field as Path<T>)) continue
    setError(field as Path<T>, { type: "server", message })
    applied = true
  }
  return applied
}

/* Error yang layak dicoba ulang otomatis (gangguan sementara) */
export function isRetryableError(error: unknown): boolean {
  if (!isApiError(error)) return false
  return (
    error.code === "network" ||
    error.code === "timeout" ||
    error.code === "server" ||
    error.code === "rate_limited"
  )
}
