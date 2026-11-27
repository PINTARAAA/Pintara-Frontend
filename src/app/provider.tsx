import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { Toaster } from "@/components"
import { queryClient } from "@/lib/api"

import { ThemeProvider } from "./theme"

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    /* Mode gelap: lihat ./theme.tsx */
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
