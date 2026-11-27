import { useSearchParams } from "react-router"

import { DetailScreen } from "@/components"
import { monthKey } from "@/features/keuangan/api"
import {
  StudentBillsPanel,
  StudentBillsPeriodPill,
} from "@/features/keuangan/components"
import { parseMonth } from "@/lib/format"

/*
 * P8 · Tagihan Siswa · Figma "Laporan Keuangan / Tagihan siswa".
 * Bulan disimpan di ?bulan=YYYY-MM.
 *
 * Desktop: Page header "← Laporan Keuangan" dengan pil periode di kanan.
 */
function TagihanSiswa() {
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get("bulan"))
  const onMonthChange = (key: string) => {
    const next = new URLSearchParams(params)
    if (key === monthKey(new Date())) next.delete("bulan")
    else next.set("bulan", key)
    setParams(next, { replace: true })
  }

  return (
    <DetailScreen
      title="Tagihan Siswa"
      backLabel="Laporan Keuangan"
      desktopHeader="page"
      desktopWidth="wide"
      desktopHeaderActions={
        <StudentBillsPeriodPill month={month} onMonthChange={onMonthChange} />
      }
    >
      <StudentBillsPanel
        month={month}
        onMonthChange={onMonthChange}
        desktopPill="header"
      />
    </DetailScreen>
  )
}

export { TagihanSiswa }
