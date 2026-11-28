import { queryOptions } from "@tanstack/react-query"
import { format } from "date-fns"

import { httpClient } from "@/lib/api"
import type { LessonRecap, RecapFilter } from "@/types/rekap-les"

/*
 * Rekap & Riwayat Les · Figma PINTARA → UI Screen → Pengelola LBB →
 * P11 · Rekap & Riwayat Les
 *
 * Sudah memakai BE: getLessonRecap(filter) → GET /pengelola/riwayat-les
 *
 * Sesi yang sudah dimulai pada bulan tsb (sesi dibatalkan tidak ikut).
 * Status mengikuti alur presensi: belum dikumpulkan → belum divalidasi wali
 * → sudah divalidasi / keberatan; atau tidak terlaksana.
 */

/* ---------- Rekap ---------- */

/* `bulan` = "YYYY-MM"; `tutorId` = id profil tutor; `siswaId` = id siswa */
export async function getLessonRecap(filter: RecapFilter = {}): Promise<LessonRecap> {
  const { data } = await httpClient.get<LessonRecap>("/pengelola/riwayat-les", {
    params: {
      ...(filter.month && { bulan: format(filter.month, "yyyy-MM") }),
      ...(filter.tutorId && { tutorId: filter.tutorId }),
      ...(filter.studentId && { siswaId: filter.studentId }),
    },
  })
  return data
}

export const lessonRecapQuery = (filter: RecapFilter) =>
  queryOptions({
    queryKey: [
      "rekap-les",
      filter.month ? format(filter.month, "yyyy-MM") : "now",
      filter.tutorId ?? "",
      filter.studentId ?? "",
    ],
    queryFn: () => getLessonRecap(filter),
  })
