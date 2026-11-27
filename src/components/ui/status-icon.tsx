import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  TriangleAlertIcon,
  type LucideProps,
} from "lucide-react"

import { cn } from "@/lib/styles"

/*
 * Ikon status semantik pada Toast, Snackbar dan Alert banner Figma PINTARA:
 * Check Circle (success) · Info (info) · Alert Triangle (warning) ·
 * X Circle (error), stroke 2px, 20px, berwarna sesuai Semantic.
 */
type FeedbackStatus = "success" | "info" | "warning" | "error"

const icons = {
  success: { Icon: CircleCheckIcon, color: "text-success" },
  info: { Icon: InfoIcon, color: "text-info" },
  warning: { Icon: TriangleAlertIcon, color: "text-warning" },
  error: { Icon: CircleXIcon, color: "text-grayscale-text-negative" },
} as const

function StatusIcon({
  status,
  className,
  ...props
}: LucideProps & { status: FeedbackStatus }) {
  const { Icon, color } = icons[status]
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={2}
      className={cn("size-5 shrink-0", color, className)}
      {...props}
    />
  )
}

export { StatusIcon, type FeedbackStatus }
