import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { UserIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import {
  TabScreen,
  DataState,
  ListItem,
  Tabs,
  TabsContent,
  TabsCount,
  TabsList,
  TabsTrigger,
} from "@/components"
import {
  DashboardList,
  NotificationButton,
} from "@/features/dashboard/components"

import { scheduleBoardQuery } from "@/features/jadwal-les/api"
import { SchedulePanel } from "@/features/jadwal-les/components"
import { offersQuery } from "@/features/penawaran/api"
import { OffersPanel } from "@/features/penawaran/components"
import { matchingQueueQuery } from "@/features/pencocokan/api"
import {
  gradeLabel,
  type PengelolaRegistration,
} from "@/features/verifikasi/api"
import { formatDaysAgo } from "@/features/verifikasi/lib"
import { usePengelolaUnreadNotifications } from "@/features/notifikasi/api"

/*
 * Les (tab pengelola) · tab Pencocokan · Penawaran · Jadwal.
 *
 * P3 · Pencocokan Tutor · Figma "Pencocokan / Daftar siswa" dan
 * "Pencocokan / Kosong": siswa terverifikasi yang belum punya tutor
 * (ketuk → pilih kandidat tutor). Tab aktif disimpan di ?tab=….
 * Tab Penawaran: P4 (OffersPanel). Tab Jadwal: P5 (SchedulePanel).
 */
const TABS = [
  { value: "pencocokan", label: "Pencocokan" },
  { value: "penawaran", label: "Penawaran" },
  { value: "jadwal", label: "Jadwal" },
] as const
type TabValue = (typeof TABS)[number]["value"]

function LesPengelola() {
  const [params, setParams] = useSearchParams()
  const tab: TabValue =
    TABS.find((t) => t.value === params.get("tab"))?.value ?? "pencocokan"
  const queue = useQuery(matchingQueueQuery())
  const offers = useQuery(offersQuery())
  const schedule = useQuery(scheduleBoardQuery())
  /* Counter tab: perlu tindakan (siswa tanpa tutor · penawaran belum selesai) */
  const counts: Partial<Record<TabValue, number>> = {
    pencocokan: queue.data?.length,
    penawaran:
      offers.data && offers.data.waiting.length + offers.data.unsent.length,
    jadwal:
      schedule.data &&
      schedule.data.toSchedule.length + schedule.data.requests.length,
  }

  const unread = usePengelolaUnreadNotifications()

  return (
    <Tabs
      value={tab}
      onValueChange={(value) =>
        setParams(value === "pencocokan" ? {} : { tab: value as string }, {
          replace: true,
        })
      }
      className="contents"
    >
      <TabScreen
        title="Les"
        action={
          <NotificationButton to="/pengelola/notifikasi" unread={unread} />
        }
        subheader={
          <TabsList className="border-grayscale-border-default w-full border-b *:-mb-px">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {(counts[t.value] ?? 0) > 0 && (
                  <TabsCount>{counts[t.value]}</TabsCount>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        }
      >
        <TabsContent value="pencocokan" className="flex flex-col">
          <MatchingPanel query={queue} />
        </TabsContent>
        <TabsContent value="penawaran" className="flex flex-col">
          <OffersPanel query={offers} />
        </TabsContent>
        <TabsContent value="jadwal" className="flex flex-col">
          <SchedulePanel query={schedule} />
        </TabsContent>
      </TabScreen>
    </Tabs>
  )
}

function MatchingPanel({
  query,
}: {
  query: UseQueryResult<PengelolaRegistration[]>
}) {
  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat siswa…" />
  }
  if (query.isError) {
    return (
      <DataState
        state="error"
        title="Daftar siswa gagal dimuat"
        description="Periksa koneksi Anda, lalu coba lagi."
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }
  if (query.data.length === 0) {
    return (
      <DataState
        state="empty"
        title="Semua siswa sudah punya tutor"
        description="Siswa yang baru diverifikasi akan muncul di sini untuk dicocokkan."
      />
    )
  }

  return (
    <div className="gap-ns-m flex flex-col lg:max-w-3xl">
      <p className="text-caption text-grayscale-text-caption leading-normal">
        Siswa terverifikasi yang belum punya tutor
      </p>
      <DashboardList>
        {query.data.map((r) => (
          <ListItem
            key={r.id}
            icon={<UserIcon />}
            title={`${r.student.name} · ${gradeLabel(r.student)}`}
            description={`${r.needs.subjects.join(", ")} · terverifikasi ${formatDaysAgo(r.verifiedAt ?? r.submittedAt)}`}
            chevron
            render={<Link to={`/pengelola/les/pencocokan/${r.id}`} />}
          />
        ))}
      </DashboardList>
    </div>
  )
}

export { LesPengelola }
