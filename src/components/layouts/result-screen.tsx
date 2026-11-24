import * as React from "react"
import { CircleCheckIcon } from "lucide-react"

import { cn } from "@/lib/styles/cn"

function ResultScreen({
  title,
  description,
  align = "center",
  footer,
  footerVariant = "plain",
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "top"
  footer?: React.ReactNode
  footerVariant?: "plain" | "bar"
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col bg-grayscale-surface-default">
      <main
        className={cn(
          "mx-auto flex w-full max-w-120 flex-1 flex-col items-center gap-ns-2xl px-ns-2xl pt-ns-3xl pb-ns-2xl",
          align === "center" && "justify-center"
        )}
      >
        <div className="flex size-22 shrink-0 items-center justify-center rounded-full bg-success-subtle">
          <CircleCheckIcon
            aria-hidden="true"
            strokeWidth={2}
            className="size-11 text-grayscale-text-body"
          />
        </div>
        <div className="flex flex-col gap-ns-s text-center">
          <h1 className="text-h4 font-bold text-grayscale-text-title">{title}</h1>
          {description != null && (
            <p className="text-subtitle leading-normal text-grayscale-text-body">
              {description}
            </p>
          )}
        </div>
        {children}
      </main>

      {footer != null &&
        (footerVariant === "bar" ? (
          <div
            data-slot="action-bar"
            className="sticky bottom-0 z-10 border-t border-grayscale-border-disabled bg-grayscale-surface-default px-ns-l pt-ns-m pb-[max(var(--spacing-ns-l),env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto flex w-full max-w-120 gap-ns-m *:flex-1">
              {footer}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-120 flex-col gap-ns-s px-ns-2xl pt-ns-l pb-[max(var(--spacing-ns-2xl),env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ))}
    </div>
  )
}

export { ResultScreen }
