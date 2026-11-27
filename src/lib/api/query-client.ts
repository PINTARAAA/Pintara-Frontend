import { QueryClient } from "@tanstack/react-query"

import { isApiError, isRetryableError } from "./api-error"
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
