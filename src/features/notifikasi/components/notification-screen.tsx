import type * as React from "react"
import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryResult,
} from "@tanstack/react-query"
import { differenceInMinutes, format, isToday } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CheckIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { DetailScreen } from "@/components/layouts/detail-screen"
import { DataState } from "@/components/ui/data-state"
import { ListItem } from "@/components/ui/list-item"
import { toast } from "@/components/ui/toast-api"
import { TopAppBarButton } from "@/components/ui/top-app-bar"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components/dashboard-section"
import type {
  AppNotification,
  NotificationList,
} from "@/features/notifikasi/api/notifikasi"

/*
 * Kerangka layar Notifikasi (W9 · T7)
 *
 * "Baru" (belum dibaca) dan "Sebelumnya" (sudah dibaca), masing-masing
 * List item dengan ikon sesuai jenis + chevron. Mengetuk notifikasi
 * menandainya dibaca lalu membuka layar terkait. Tombol centang di top app
 * bar menandai semua dibaca (tampil bila ada yang baru).
 */

/* "2 jam lalu" · "12 menit lalu" · "08.00" (hari ini) · "8 Okt" */
function formatWhen(date: Date, now = new Date()) {
  const minutes = differenceInMinutes(now, date)
  if (minutes < 1) return "baru saja"
  if (minutes < 60) return `${minutes} menit lalu`
  if (minutes < 180) return `${Math.floor(minutes / 60)} jam lalu`
  if (isToday(date)) return format(date, "HH.mm")
  return format(date, "d MMM", { locale: localeId })
}

function NotificationScreen<Kind extends string>({
  query,
  queryKey,
  icons,
  markRead,
  markAllRead,
  emptyDescription,
}: {
  query: UseQueryResult<NotificationList<Kind>>
  /* Key yang di-invalidate setelah status baca berubah */
  queryKey: QueryKey
  icons: Record<Kind, React.ReactNode>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  emptyDescription: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const data = query.data

  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
      toast.success("Semua notifikasi ditandai dibaca")
    },
  })

  const open = async (notification: AppNotification<Kind>) => {
    if (!notification.read) {
      await markRead(notification.id)
      void queryClient.invalidateQueries({ queryKey })
    }
    navigate(notification.to)
  }

  const renderList = (items: AppNotification<Kind>[]) => (
    <DashboardList>
      {items.map((n) => (
        <ListItem
          key={n.id}
          icon={icons[n.kind]}
          title={n.title}
          description={`${n.body} · ${n.status ?? formatWhen(n.createdAt)}`}
          chevron
          render={<button type="button" onClick={() => void open(n)} />}
        />
      ))}
    </DashboardList>
  )

  return (
    <DetailScreen
      title="Notifikasi"
      className="gap-ns-2xl"
      action={
        data && data.unread.length > 0 ? (
          <TopAppBarButton
            variant="plain"
            label="Tandai semua dibaca"
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending}
          >
            <CheckIcon />
          </TopAppBarButton>
        ) : undefined
      }
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat notifikasi…" />
      ) : query.isError ? (
        <DataState
          state="error"
          title="Notifikasi gagal dimuat"
          description="Periksa koneksi Anda, lalu coba lagi."
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : data && data.unread.length + data.read.length > 0 ? (
        <>
          {data.unread.length > 0 && (
            <DashboardSection title="Baru">
              {renderList(data.unread)}
            </DashboardSection>
          )}
          {data.read.length > 0 && (
            <DashboardSection title="Sebelumnya">
              {renderList(data.read)}
            </DashboardSection>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <DataState
            state="empty"
            title="Belum ada notifikasi"
            description={emptyDescription}
          />
        </div>
      )}
    </DetailScreen>
  )
}

export { NotificationScreen }
