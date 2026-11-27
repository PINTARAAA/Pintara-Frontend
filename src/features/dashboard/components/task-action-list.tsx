import { CircleCheckIcon } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components"
import { TASK_ICONS } from "@/features/dashboard/components/task-icons"
import type { DashboardTask } from "@/types/dashboard"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/styles"

/*
 * TaskActionList · "Perlu tindakan" versi desktop.
 *
 * Tiap baris: ikon dalam lingkaran, judul + deskripsi, jumlah/nominal tebal
 * di kanan, lalu tombol aksi. Tanpa kotak bergaris — pemisah antar baris
 * berupa garis tipis.
 *
 * appearance="pengelola" (Figma P1 · Beranda (Desktop)): ikon Primary,
 *   jumlah H4, tombol secondary berlebar tetap agar kolom angka sejajar.
 *   Tugas bertipe "alert" memakai warna peringatan.
 * appearance="wali" (Figma W1 · Beranda (Desktop)): ikon di latar
 *   Grayscale/Surface/subtitle, nominal Body/Bold, garis Border/default,
 *   baris 16px, tombol selebar label. Tugas `urgent` (mis. tagihan lewat
 *   jatuh tempo) tampil paling atas: ikon Semantic/Error, tombol primary.
 * appearance="tutor" (Figma T1 · Beranda (Desktop)): baris seperti wali,
 *   ikon Primary/Surface/subtitle (alert: peringatan), tanpa pengurutan.
 * `highlight` tampil tebal Semantic/Error setelah deskripsi. Tombol primary
 * untuk tugas `urgent` atau `primary`, selain itu secondary.
 */
function TaskActionList({
  tasks,
  appearance = "pengelola",
  emptyTitle = "Semua beres",
  emptyDescription = "Tidak ada yang perlu ditindaklanjuti saat ini.",
  className,
}: {
  tasks: DashboardTask[]
  appearance?: "pengelola" | "wali" | "tutor"
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}) {
  const wali = appearance === "wali"
  /* Wali & tutor: baris 16px, garis Border/default, tombol selebar label */
  const roomy = appearance !== "pengelola"
  const divider = roomy
    ? "border-grayscale-border-default"
    : "border-grayscale-surface-disabled"

  if (tasks.length === 0) {
    return (
      <div className={cn("flex items-center gap-ns-l border-t py-ns-l", divider, className)}>
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

  /* Wali: tugas mendesak didahulukan (urutan lain tetap) */
  const sorted = wali
    ? [...tasks].sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent))
    : tasks

  return (
    <ul className={cn("border-t", divider, className)}>
      {sorted.map((task) => {
        const Icon = TASK_ICONS[task.icon]
        const value =
          task.amount != null ? formatRupiah(task.amount) : task.count ?? null
        return (
          <li
            key={task.id}
            className={cn(
              "flex items-center gap-ns-l border-b",
              divider,
              roomy ? "py-ns-l" : "py-3.5"
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                task.urgent
                  ? "bg-error-subtle text-grayscale-text-negative"
                  : task.icon === "alert"
                    ? "bg-warning-subtle text-warning"
                    : wali
                      ? "bg-grayscale-surface-subtitle text-primary-text-primary"
                      : "bg-primary-surface-subtitle text-primary-text-primary"
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col leading-normal",
                /* Wali & tutor: Figma 2px, dilonggarkan ke 4px agar judul tidak menempel */
                roomy ? "gap-ns-2xs" : "gap-ns-s"
              )}
            >
              <p className="text-body font-bold text-grayscale-text-title">{task.title}</p>
              <p className="text-subtitle text-grayscale-text-subtitle">
                {task.description}
                {task.highlight && (
                  <>
                    {" · "}
                    <strong className="font-bold text-grayscale-text-negative">{task.highlight}</strong>
                  </>
                )}
              </p>
            </div>
            {value != null && (
              <p
                className={cn(
                  "text-right font-bold text-grayscale-text-title",
                  roomy ? "text-body leading-normal" : "min-w-10 text-h4"
                )}
              >
                {value}
              </p>
            )}
            <Button
              variant={task.urgent || task.primary ? "primary" : "secondary"}
              size="sm"
              className={roomy ? undefined : "w-28"}
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
