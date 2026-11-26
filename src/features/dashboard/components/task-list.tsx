import { CircleCheckIcon } from "lucide-react"
import { Link } from "react-router"

import { ListItem } from "@/components"
import { DashboardList } from "@/features/dashboard/components/dashboard-section"
import { TASK_ICONS } from "@/features/dashboard/components/task-icons"
import type { DashboardTask } from "@/types/dashboard"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/styles"


/*
 * TaskList · daftar "Perlu tindakan". Tiap baris adalah tautan ke halaman
 * terkait; nominal (amount) atau jumlah (count) tampil tebal di kanan.
 * Bila tidak ada tugas, tampil pesan "Semua beres" agar pengguna yakin
 * tidak ada yang terlewat.
 */
function TaskList({
  tasks,
  columns = 1,
  emptyTitle = "Semua beres",
  emptyDescription = "Tidak ada yang perlu ditindaklanjuti saat ini.",
}: {
  tasks: DashboardTask[]
  /* 2 = dua kolom di desktop (≥ lg) */
  columns?: 1 | 2
  emptyTitle?: string
  emptyDescription?: string
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default px-ns-l py-ns-m">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
          <CircleCheckIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-ns-2xs leading-normal">
          <p className="text-subtitle leading-normal font-bold text-grayscale-text-title">{emptyTitle}</p>
          <p className="text-caption leading-normal text-grayscale-text-caption">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardList
      className={cn(
        columns === 2 &&
          "lg:grid lg:grid-cols-2 lg:[&>li:nth-last-child(2):nth-child(odd)]:after:hidden lg:[&>li:nth-child(odd)]:border-r lg:[&>li:nth-child(odd)]:border-grayscale-border-disabled"
      )}
    >
      {tasks.map((task) => {
        const Icon = TASK_ICONS[task.icon]
        return (
          <ListItem
            key={task.id}
            icon={<Icon />}
            title={task.title}
            description={task.description}
            trailingText={
              task.amount != null
                ? formatRupiah(task.amount)
                : task.count != null
                  ? task.count
                  : undefined
            }
            chevron
            render={<Link to={task.to} />}
          />
        )
      })}
    </DashboardList>
  )
}

export { TaskList }
