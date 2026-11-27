import axios, { type AxiosInstance } from "axios"

import { toApiError } from "./api-error"
import { clearAccessToken, getAccessToken } from "./auth-token"

/*
 * Instance axios untuk semua panggilan ke backend.
 *
 *   const { data } = await httpClient.get<Tutor[]>("/pengelola/tutor")
 *
 * Request interceptor  : pasang header Authorization dari token tersimpan.
 * Response interceptor : setiap kegagalan diubah menjadi `ApiError`
 *                        (lihat ./api-error.ts). Respons 401 di luar
 *                        endpoint /auth menghapus token lalu memanggil
 *                        handler sesi berakhir (default: ke halaman masuk).
 */

declare module "axios" {
  interface AxiosRequestConfig {
    /* true: respons 401 tidak memicu handler sesi berakhir */
    skipAuthRedirect?: boolean
  }
}

/* Endpoint autentikasi: 401 berarti kredensial salah, bukan sesi berakhir */
const AUTH_ENDPOINT = /^\/?auth\//

let unauthorizedHandler = () => {
  if (window.location.pathname.startsWith("/masuk")) return
  window.location.replace("/masuk?alasan=sesi-berakhir")
}

/*
 * Ganti perilaku saat sesi berakhir, mis. dari AppProvider agar cache
 * React Query ikut dibuang dan navigasi memakai router.
 */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export function createHttpClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { Accept: "application/json" },
  })

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token && !config.headers.has("Authorization")) {
      config.headers.set("Authorization", `Bearer ${token}`)
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = toApiError(error)
      const config = axios.isAxiosError(error) ? error.config : undefined
      const isAuthRequest = AUTH_ENDPOINT.test(config?.url ?? "")

      if (
        apiError.code === "unauthorized" &&
        !isAuthRequest &&
        !config?.skipAuthRedirect
      ) {
        clearAccessToken()
        unauthorizedHandler()
      }

      if (import.meta.env.DEV && apiError.code !== "canceled") {
        console.warn(
          `[api] ${config?.method?.toUpperCase() ?? ""} ${config?.url ?? ""} →`,
          apiError.status || apiError.code,
          apiError
        )
      }

      return Promise.reject(apiError)
    }
  )

  return client
}

export const httpClient = createHttpClient(import.meta.env.VITE_API_URL)
