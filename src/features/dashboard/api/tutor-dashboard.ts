import { queryOptions } from "@tanstack/react-query"

import { tutorDashboardData } from "@/lib/data/dashboard"
import { assertMockAllowed, delay } from "@/lib/data/mock"
import type { TutorDashboardData } from "@/types/dashboard"

/*
 * Beranda Tutor · Figma PINTARA → UI Screen → Tutor → T1 · Beranda
 *
 * TODO(backend): ganti isi getTutorDashboard() dengan
 *   httpClient.get("/tutor/dashboard")
 */

export async function getTutorDashboard(): Promise<TutorDashboardData> {
  assertMockAllowed()
  await delay()
  return tutorDashboardData()
}

export const tutorDashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard", "tutor"],
    queryFn: getTutorDashboard,
  })
