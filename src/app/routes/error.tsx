import { isRouteErrorResponse, useRouteError } from "react-router"

import { DataState } from "@/components/ui/data-state"

/*
 * Error boundary tingkat route: tampil bila halaman gagal dimuat atau
 * terjadi error saat render, agar aplikasi tidak berakhir di layar putih.
 */
export default function RouteError() {
  const error = useRouteError()

  const description = isRouteErrorResponse(error)
    ? `Terjadi kesalahan (${error.status}). Silakan coba lagi.`
    : "Terjadi kendala saat menampilkan halaman. Silakan muat ulang."

  if (import.meta.env.DEV) console.error(error)

  return (
    <main className="grid min-h-dvh place-items-center bg-grayscale-surface-subtitle p-ns-2xl">
      <DataState
        state="error"
        title="Halaman gagal dimuat"
        description={description}
        action={{ label: "Muat ulang", onClick: () => window.location.reload() }}
        className="max-w-140"
      />
    </main>
  )
}
