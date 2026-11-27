import type * as React from "react"

import { Button } from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import { useExpandable } from "@/hooks"

/*
 * P9 · Daftar Data Tutor / Data Siswa yang ringkas: hanya `preview` baris
 * pertama yang tampil, sisanya dibuka lewat "Lihat N <noun> lainnya" ·
 * "Ringkas" (pola sama dengan Rekap & Riwayat Les).
 *
 * Pasang `key` yang berubah saat pencarian/filter berubah agar daftar
 * kembali ringkas untuk hasil yang baru.
 */
const PREVIEW = 10

function MasterList<T>({
  items,
  noun,
  preview = PREVIEW,
  renderItem,
}: {
  items: T[]
  /* "tutor" / "siswa" untuk label tombol */
  noun: string
  preview?: number
  renderItem: (item: T) => React.ReactNode
}) {
  const list = useExpandable(items, preview)

  return (
    <>
      <DashboardList>{list.visible.map(renderItem)}</DashboardList>
      {list.hidden > 0 && (
        <Button
          variant="tertiary"
          size="sm"
          className="w-fit"
          aria-expanded={list.expanded}
          onClick={list.toggle}
        >
          {list.expanded ? "Ringkas" : `Lihat ${list.hidden} ${noun} lainnya`}
        </Button>
      )}
    </>
  )
}

export { MasterList }
