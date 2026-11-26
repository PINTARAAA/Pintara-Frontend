import { queryOptions } from "@tanstack/react-query"

import { waliDashboardData } from "@/lib/data/dashboard"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type { WaliDashboardData } from "@/types/dashboard"

/*
 * Beranda Wali Murid · Figma PINTARA → UI Screen → Wali Murid → W1 · Beranda
 *
 * TODO(backend): ganti isi getWaliDashboard() dengan
 *   httpClient.get(`/wali/dashboard`, { params: { siswa: studentId } })
 */

export async function getWaliDashboard(
  studentId?: string
): Promise<WaliDashboardData> {
  assertMockAllowed()
  await delay()
  return waliDashboardData(studentId)
}

export const waliDashboardQuery = (studentId?: string) =>
  queryOptions({
    queryKey: ["dashboard", "wali", studentId ?? "default"],
    queryFn: () => getWaliDashboard(studentId),
  })
