import { useSearchParams } from "react-router"

import { DetailScreen } from "@/components"
import { monthKey } from "@/features/keuangan/api"
import { StudentBillsPanel } from "@/features/keuangan/components"
import { parseMonth } from "@/features/keuangan/lib"

/*
 * P8 · Tagihan Siswa · Figma "Laporan Keuangan / Tagihan siswa".
 * Bulan disimpan di ?bulan=YYYY-MM.
 */
function TagihanSiswa() {
  const [params, setParams] = useSearchParams()

  return (
    <DetailScreen title="Tagihan Siswa">
      <StudentBillsPanel
        month={parseMonth(params.get("bulan"))}
        onMonthChange={(key) => {
          const next = new URLSearchParams(params)
          if (key === monthKey(new Date())) next.delete("bulan")
          else next.set("bulan", key)
          setParams(next, { replace: true })
        }}
      />
    </DetailScreen>
  )
}

export { TagihanSiswa }
