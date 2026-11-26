import { queryOptions } from "@tanstack/react-query"

import { pengelolaDashboardData } from "@/lib/data/dashboard"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type { PengelolaDashboardData } from "@/types/dashboard"

/*
 * Beranda Pengelola LBB · Figma PINTARA → UI Screen → Pengelola → P1 · Beranda
 *
 * TODO(backend): ganti isi getPengelolaDashboard() dengan
 *   httpClient.get("/pengelola/dashboard")
 */

export async function getPengelolaDashboard(): Promise<PengelolaDashboardData> {
  assertMockAllowed()
  await delay()
  return pengelolaDashboardData()
}

export const pengelolaDashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard", "pengelola"],
    queryFn: getPengelolaDashboard,
  })
