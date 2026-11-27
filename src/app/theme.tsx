import * as React from "react"

import { ThemeContext, type Theme } from "./theme-context"

/*
 * Tema tampilan (mode gelap, di luar Figma).
 *
 * Kelas `.light` / `.dark` di <html> mengaktifkan token di
 * src/styles/tokens.css. Skrip di index.html memasang kelas yang sama
 * sebelum render pertama agar tidak berkedip; provider ini mengambil alih
 * setelahnya: menyimpan pilihan di localStorage dan mengikuti perubahan
 * tema sistem saat pilihan = "system". Kunci penyimpanan harus sama dengan
 * skrip index.html.
 *
 * (Pengganti next-themes: versi 0.4 merender <script> di dalam komponen,
 * yang di React 19 sisi klien selalu memunculkan error di konsol.)
 */
const STORAGE_KEY = "pintara-theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    /* localStorage tidak tersedia (mode privat ketat): ikut sistem */
  }
  return "system"
}

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia(DARK_QUERY).matches)
  const root = document.documentElement
  if (root.classList.contains("dark") === dark) return

  /*
   * Matikan transisi sesaat agar elemen ber-`transition-colors` tidak
   * beranimasi dari warna tema lama (tampak belang saat berganti)
   */
  const style = document.createElement("style")
  style.textContent = "*,*::before,*::after{transition:none!important}"
  document.head.appendChild(style)
  root.classList.toggle("dark", dark)
  root.classList.toggle("light", !dark)
  void window.getComputedStyle(document.body).color
  requestAnimationFrame(() => style.remove())
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(readTheme)

  React.useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* Tetap berlaku untuk sesi ini meski tidak tersimpan */
    }
    setThemeState(next)
  }, [])

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}

export { ThemeProvider }
