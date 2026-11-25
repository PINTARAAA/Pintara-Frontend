import { InitialsAvatar } from "@/features/dashboard/components/initials-avatar"
import { cn } from "@/lib/styles/cn"

/*
 * Kartu profil: avatar inisial, nama, peran · email.
 *   default = Akun wali/tutor (W8 · T6): avatar 56px, nama Body/Bold
 *   compact = Menu Lainnya pengelola (P1): avatar 48px, nama Subtitle/Bold
 */
function AccountProfile({
  name,
  initials,
  role,
  email,
  size = "default",
}: {
  name: string
  initials: string
  role: string
  email: string
  size?: "default" | "compact"
}) {
  const compact = size === "compact"
  return (
    <section
      aria-label="Profil"
      className="flex items-center gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l"
    >
      <InitialsAvatar
        initials={initials}
        className={compact ? "size-12" : "size-14 text-body"}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
        <p
          className={cn(
            "font-bold text-grayscale-text-title",
            compact ? "text-subtitle" : "text-body"
          )}
        >
          {name}
        </p>
        <p className="truncate text-caption text-grayscale-text-caption">
          {role} · {email}
        </p>
      </div>
    </section>
  )
}

export { AccountProfile }
