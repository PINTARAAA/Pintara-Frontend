import { InitialsAvatar } from "@/features/dashboard/components/initials-avatar"

/* Kartu profil layar Akun (W8 · T6): avatar inisial 56px, nama, peran · email */
function AccountProfile({
  name,
  initials,
  role,
  email,
}: {
  name: string
  initials: string
  role: string
  email: string
}) {
  return (
    <section
      aria-label="Profil"
      className="flex items-center gap-ns-m rounded-(--comp-radius-md) border border-grayscale-border-default bg-grayscale-surface-default p-ns-l"
    >
      <InitialsAvatar initials={initials} className="size-14 text-body" />
      <div className="flex min-w-0 flex-1 flex-col gap-ns-2xs leading-normal">
        <p className="text-body font-bold text-grayscale-text-title">{name}</p>
        <p className="truncate text-caption text-grayscale-text-caption">
          {role} · {email}
        </p>
      </div>
    </section>
  )
}

export { AccountProfile }
