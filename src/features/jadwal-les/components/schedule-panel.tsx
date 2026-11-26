import type { UseQueryResult } from "@tanstack/react-query"
import { CalendarIcon, RotateCwIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router"

import { DataState, ListItem } from "@/components"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import { formatChangeTitle } from "@/features/jadwal/lib/format"
import {
  formatSessions,
  type ScheduleBoard,
} from "@/features/jadwal-les/api/jadwal-les"
import { formatDaysAgo } from "@/features/verifikasi/lib/format"
import { formatDayMonth } from "@/lib/format/date"

/*
 * P5 · Jadwal (tab Les) · Figma "Atur Jadwal / Daftar"
 *
 * [Pengajuan perubahan dari wali (W4) → tinjau] → Perlu dijadwalkan
 * (penawaran diterima di P4 → atur jadwal) → Jadwal aktif · N pasangan
 * (ketuk → ubah jadwal).
 */
const BASE = "/pengelola/les/jadwal"

function SchedulePanel({ query }: { query: UseQueryResult<ScheduleBoard> }) {
  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat jadwal…" />
  }
  if (query.isError) {
    return (
      <DataState
        state="error"
        title="Jadwal gagal dimuat"
        description="Periksa koneksi Anda, lalu coba lagi."
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }

  const { toSchedule, requests, active } = query.data

  return (
    <div className="gap-ns-2xl grid lg:grid-cols-2 lg:items-start">
      <div className="gap-ns-2xl flex flex-col">
        {requests.length > 0 && (
          <DashboardSection
            title="Pengajuan perubahan"
            description="Diajukan wali, perlu persetujuan Anda"
          >
            <DashboardList>
              {requests.map((r) => (
                <ListItem
                  key={r.id}
                  icon={<RotateCwIcon />}
                  title={`${r.studentName} × ${r.tutor.name}`}
                  description={`${r.subject} · ${formatChangeTitle(r)} · diajukan ${formatDayMonth(r.submittedAt)}`}
                  chevron
                  render={<Link to={`${BASE}/pengajuan/${r.id}`} />}
                />
              ))}
            </DashboardList>
          </DashboardSection>
        )}

        <DashboardSection title="Perlu dijadwalkan">
          {toSchedule.length > 0 ? (
            <DashboardList>
              {toSchedule.map((o) => (
                <ListItem
                  key={o.id}
                  icon={<UsersIcon />}
                  title={`${o.student.name} × ${o.tutor.name}`}
                  description={`${o.subjects.join(", ")} · penawaran diterima ${formatDaysAgo(o.answeredAt ?? o.sentAt)}`}
                  chevron
                  render={<Link to={`${BASE}/atur/${o.id}`} />}
                />
              ))}
            </DashboardList>
          ) : (
            <p className="text-caption text-grayscale-text-caption leading-normal">
              Semua penawaran yang diterima tutor sudah dijadwalkan.
            </p>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title={`Jadwal aktif · ${active.length} pasangan`}>
        {active.length > 0 ? (
          <DashboardList>
            {active.map((p) => (
              <ListItem
                key={p.id}
                icon={<CalendarIcon />}
                title={`${p.student.name} × ${p.tutor.name}`}
                description={formatSessions(p.sessions)}
                chevron
                render={<Link to={`${BASE}/${p.id}/ubah`} />}
              />
            ))}
          </DashboardList>
        ) : (
          <DataState
            state="empty"
            icon={<CalendarIcon />}
            title="Belum ada jadwal aktif"
            description="Jadwal les tampil di sini setelah Anda mengaturnya."
          />
        )}
      </DashboardSection>
    </div>
  )
}

export { SchedulePanel }
