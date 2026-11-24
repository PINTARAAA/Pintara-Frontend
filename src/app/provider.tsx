import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/query-client"

/*
 * AppProvider · semua provider global aplikasi di satu tempat.
 * Tambahkan provider baru (mis. auth) di sini, bukan di main.tsx.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
