import { SearchXIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { DataState } from "@/components"

/* 404 · URL tidak cocok dengan route mana pun */
export default function NotFoundRoute() {
  const navigate = useNavigate()

  return (
    <main className="grid min-h-dvh place-items-center bg-grayscale-surface-subtitle p-ns-2xl">
      <DataState
        state="empty"
        icon={<SearchXIcon />}
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan."
        action={{ label: "Kembali ke beranda", onClick: () => navigate("/") }}
        className="max-w-140"
      />
    </main>
  )
}
