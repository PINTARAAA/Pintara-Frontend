import { QueryClient } from "@tanstack/react-query"

import { isApiError, isRetryableError } from "./api-error"

/*
 * QueryClient global untuk TanStack Query (data dari API).
 *   staleTime 1 menit  : data dianggap segar, tidak di-fetch ulang tiap render
 *   retry              : satu kali percobaan ulang, hanya untuk gangguan
 *                        sementara (offline, timeout, 5xx, 429). Error 4xx
 *                        seperti 404/403/422 tidak akan berubah bila diulang.
 *   refetchOnWindowFocus false : tidak fetch ulang hanya karena pindah tab
 */
const MAX_RETRIES = 1

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (failureCount >= MAX_RETRIES) return false
        /* Error di luar httpClient (mis. data contoh) tetap dicoba ulang */
        return isApiError(error) ? isRetryableError(error) : true
      },
      refetchOnWindowFocus: false,
    },
  },
})
