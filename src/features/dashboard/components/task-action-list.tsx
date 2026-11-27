import { CircleCheckIcon } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components"
import { TASK_ICONS } from "@/features/dashboard/components/task-icons"
import type { DashboardTask } from "@/types/dashboard"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * TaskActionList · "Perlu tindakan" versi desktop
 * (Figma PINTARA → UI Screen → P1 · Beranda (Desktop)).
 *
 * Tiap baris: ikon dalam lingkaran, judul + deskripsi, jumlah/nominal tebal
 * di kanan, lalu tombol aksi berlebar tetap agar kolom angka sejajar.
 * Tanpa kotak bergaris — pemisah antar baris berupa garis tipis. Tugas
 * bertipe "alert" memakai warna peringatan.
 */
function TaskActionList({
  tasks,
  emptyTitle = "Semua beres",
  emptyDescription = "Tidak ada yang perlu ditindaklanjuti saat ini.",
  className,
}: {
  tasks: DashboardTask[]
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}) {
  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-ns-l border-t border-grayscale-surface-disabled py-ns-l",
          className
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
          <CircleCheckIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-ns-s leading-normal">
          <p className="text-body font-bold text-grayscale-text-title">{emptyTitle}</p>
          <p className="text-subtitle text-grayscale-text-subtitle">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <ul className={cn("border-t border-grayscale-surface-disabled", className)}>
      {tasks.map((task) => {
        const Icon = TASK_ICONS[task.icon]
        const warning = task.icon === "alert"
        const value =
          task.amount != null ? formatRupiah(task.amount) : task.count ?? null
        return (
          <li
            key={task.id}
            className="flex items-center gap-ns-l border-b border-grayscale-surface-disabled py-3.5"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                warning
                  ? "bg-warning-subtle text-warning"
                  : "bg-primary-surface-subtitle text-primary-text-primary"
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-ns-s leading-normal">
              <p className="text-body font-bold text-grayscale-text-title">{task.title}</p>
              <p className="text-subtitle text-grayscale-text-subtitle">
                {task.description}
              </p>
            </div>
            {value != null && (
              <p className="min-w-10 text-right text-h4 font-bold text-grayscale-text-title">
                {value}
              </p>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="w-28"
              nativeButton={false}
              render={<Link to={task.to} />}
            >
              {task.actionLabel ?? "Buka"}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

export { TaskActionList }
