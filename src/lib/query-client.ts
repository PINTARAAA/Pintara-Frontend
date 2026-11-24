import { QueryClient } from "@tanstack/react-query"

/*
 * QueryClient global untuk TanStack Query (data dari API).
 *   staleTime 1 menit  : data dianggap segar, tidak di-fetch ulang tiap render
 *   retry 1            : satu kali percobaan ulang bila request gagal
 *   refetchOnWindowFocus false : tidak fetch ulang hanya karena pindah tab
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
