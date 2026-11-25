import { useSearchParams } from "react-router"

import type {
  AccountStatus,
  MasterFilter,
} from "@/features/data-master/api/data-master"

/* Filter daftar Data Tutor / Data Siswa di ?q=…&mapel=…&lokasi=…&status=… */
export const ALL = "semua"

export type MasterFilterKey = "q" | "mapel" | "lokasi" | "status"

export function useMasterFilter() {
  const [params, setParams] = useSearchParams()
  const status = params.get("status")
  const filter: MasterFilter = {
    query: params.get("q") ?? "",
    subject: params.get("mapel") ?? undefined,
    district: params.get("lokasi") ?? undefined,
    status:
      status === "aktif" || status === "nonaktif"
        ? (status as AccountStatus)
        : undefined,
  }

  const update = (key: MasterFilterKey, value: string) => {
    const next = new URLSearchParams(params)
    if (value.trim() && value !== ALL) next.set(key, value.trim())
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const reset = () => setParams(new URLSearchParams(), { replace: true })
  const filtered = Boolean(
    filter.query?.trim() || filter.subject || filter.district || filter.status
  )

  return { filter, update, reset, filtered }
}
