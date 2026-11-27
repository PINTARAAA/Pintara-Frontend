import type * as React from "react"

import { Button } from "@/components"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import { useExpandable } from "@/hooks"

/*
 * ExpandableList · DashboardList ringkas untuk daftar panjang: hanya
 * `preview` baris pertama yang tampil, sisanya dibuka lewat tombol teks
 * "Lihat selengkapnya (N lainnya)" · "Ringkas" di bawah daftar. Tombol tidak
 * tampil bila jumlah baris ≤ `preview`.
 *
 * Pasang `key` yang berubah saat filter berubah agar daftar kembali ringkas.
 *
 * <ExpandableList items={sessions} renderItem={(s) => <ListItem key={s.id} … />} />
 */
const PREVIEW = 5

function ExpandableList<T>({
  items,
  renderItem,
  preview = PREVIEW,
}: {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  preview?: number
}) {
  const list = useExpandable(items, preview)

  return (
    <>
      <DashboardList>{list.visible.map(renderItem)}</DashboardList>
      {list.hidden > 0 && (
        <Button
          variant="tertiary"
          size="sm"
          className="-mt-ns-2xs w-fit self-center"
          aria-expanded={list.expanded}
          onClick={list.toggle}
        >
          {list.expanded
            ? "Ringkas"
            : `Lihat selengkapnya (${list.hidden} lainnya)`}
        </Button>
      )}
    </>
  )
}

export { ExpandableList }
