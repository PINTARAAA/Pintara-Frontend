import { useSearchParams } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { monthKey } from "@/features/keuangan/api/honor"
import { StudentBillsPanel } from "@/features/keuangan/components/student-bills-panel"
import { parseMonth } from "@/features/keuangan/lib/month"

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
