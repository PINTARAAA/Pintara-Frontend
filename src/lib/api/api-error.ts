import { isAxiosError, isCancel } from "axios"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

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
  details?: unknown
  cause?: unknown
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly serverCode?: string
  readonly details?: unknown

  constructor(code: ApiErrorCode, options: ApiErrorOptions = {}) {
    super(options.message ?? DEFAULT_ERROR_MESSAGES[code], {
      cause: options.cause,
    })
    this.name = "ApiError"
    this.code = code
    this.status = options.status ?? 0
    this.fieldErrors = options.fieldErrors ?? {}
    this.serverCode = options.serverCode
    this.details = options.details
  }

  get hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError

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

type ParsedBody = {
  message?: string
  fieldErrors: Record<string, string>
  serverCode?: string
  details?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined

function parseFieldErrors(details: unknown): Record<string, string> {
  const result: Record<string, string> = {}
  if (!Array.isArray(details)) return result

  for (const item of details) {
    if (!isRecord(item)) continue
    const field = nonEmpty(item.field)
    const message = nonEmpty(item.message)
    if (field && message && !(field in result)) result[field] = message
  }
  return result
}

export function parseErrorBody(data: unknown): ParsedBody {
  const error = isRecord(data) && isRecord(data.error) ? data.error : undefined
  if (!error) return { fieldErrors: {} }

  return {
    message: nonEmpty(error.message),
    fieldErrors: parseFieldErrors(error.details),
    serverCode: nonEmpty(error.code),
    details: error.details,
  }
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (isCancel(error)) {
    return new ApiError("canceled", { cause: error })
  }

  if (isAxiosError(error)) {
    const response = error.response

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
      message: code === "server" ? undefined : body.message,
      fieldErrors: body.fieldErrors,
      serverCode: body.serverCode,
      details: body.details,
      cause: error,
    })
  }

  if (error instanceof Error) {
    return new ApiError("unknown", { message: error.message, cause: error })
  }

  return new ApiError("unknown", { cause: error })
}

export function getErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGES.unknown
): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

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

export function isRetryableError(error: unknown): boolean {
  if (!isApiError(error)) return false
  return (
    error.code === "network" ||
    error.code === "timeout" ||
    error.code === "server"
  )
}
