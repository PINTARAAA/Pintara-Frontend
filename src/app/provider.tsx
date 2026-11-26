import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { Toaster } from "@/components"
import { queryClient } from "@/lib/api"

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
