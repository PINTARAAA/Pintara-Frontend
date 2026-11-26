import { cn } from "@/lib/styles"

/*
 * Avatar inisial (Figma: Avatar di Student switcher, Next session, Tutor
 * candidate). tone="subtle" = Primary/Surface/subtitle (di latar putih),
 * tone="inverse" = putih (di atas kartu biru).
 */
function InitialsAvatar({
  initials,
  size = "md",
  tone = "subtle",
  className,
}: {
  initials: string
  size?: "sm" | "md"
  tone?: "subtle" | "inverse"
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-caption font-bold text-primary-text-primary",
        size === "sm" ? "size-7" : "size-9",
        tone === "inverse"
          ? "bg-grayscale-surface-default"
          : "bg-primary-surface-subtitle",
        className
      )}
    >
      {initials}
    </span>
  )
}

export { InitialsAvatar }
