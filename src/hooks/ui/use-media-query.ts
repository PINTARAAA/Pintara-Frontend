import * as React from "react"

/*
 * true bila media query cocok, mis. useMediaQuery(DESKTOP_QUERY) untuk
 * memilih komponen berbeda di desktop (Popover) dan mobile (Sheet).
 * Ikut berubah saat jendela diubah ukurannya.
 */
export const DESKTOP_QUERY = "(min-width: 64rem)" /* breakpoint lg */

export function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
