import * as React from "react"

/* Konteks tema tampilan; provider di ./theme.tsx */
type Theme = "light" | "dark" | "system"

const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error("useTheme harus dipakai di dalam ThemeProvider")
  return context
}

export { ThemeContext, useTheme, type Theme }
