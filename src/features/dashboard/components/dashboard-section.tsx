import * as React from "react"
import { Link } from "react-router"

import { Button, List } from "@/components"
import { cn } from "@/lib/styles"

function DashboardSection({
  title,
  description,
  action,
  className,
  headingClassName,
  children,
}: {
  /* Teks, atau teks + elemen kecil seperti pil jumlah */
  title: React.ReactNode
  /* Kelas tambahan untuk judul, mis. "lg:text-headline" di desktop */
  headingClassName?: string
  /* Keterangan Caption di bawah judul, mis. rentang tanggal "24–30 November 2026" */
  description?: React.ReactNode
  action?: { label: string; to: string }
  className?: string
  children: React.ReactNode
}) {
  const headingId = React.useId()
  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-ns-m", className)}>
      <div className="flex items-center justify-between gap-ns-s">
        <div className="flex flex-col gap-ns-2xs leading-normal">
          <h2
            id={headingId}
            className={cn("text-body font-bold text-grayscale-text-title", headingClassName)}
          >
            {title}
          </h2>
          {description != null && (
            <p className="text-caption text-grayscale-text-caption">{description}</p>
          )}
        </div>
        {action && (
          <Button
            variant="tertiary"
            size="sm"
            className="-my-ns-s -mr-ns-l"
            nativeButton={false}
            render={<Link to={action.to} />}
          >
            {action.label}
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

function DashboardList({ className, ...props }: React.ComponentProps<typeof List>) {
  return (
    <List
      className={cn(
        "overflow-hidden rounded-(--comp-radius-md) border border-grayscale-border-default",
        className
      )}
      {...props}
    />
  )
}

export { DashboardSection, DashboardList }
