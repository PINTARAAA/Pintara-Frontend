import * as React from "react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { List } from "@/components/ui/list-item"
import { cn } from "@/lib/styles/cn"

function DashboardSection({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: { label: string; to: string }
  className?: string
  children: React.ReactNode
}) {
  const headingId = React.useId()
  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-ns-m", className)}>
      <div className="flex items-center justify-between gap-ns-s">
        <h2 id={headingId} className="text-body leading-normal font-bold text-grayscale-text-title">
          {title}
        </h2>
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
