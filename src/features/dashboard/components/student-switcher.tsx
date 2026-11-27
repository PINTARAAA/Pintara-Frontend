import { ChevronDownIcon, UserPlusIcon } from "lucide-react"
import { Link } from "react-router"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components"
import type { WaliStudent } from "@/types/dashboard"
import { InitialsAvatar } from "@/features/dashboard/components/initials-avatar"

/*
 * StudentSwitcher · Figma "Student switcher" (Wali / Beranda): pil putih
 * ber-border dengan avatar 28px, "Nama · Kelas", dan chevron. Wali dengan
 * lebih dari satu anak dapat berganti anak; seluruh isi beranda mengikuti.
 * Bila hanya satu anak (dan tanpa `addStudentTo`), tampil sebagai label
 * biasa tanpa menu. `addStudentTo` menambah item "Daftarkan anak" di akhir
 * menu (ke W2 · Pendaftaran Siswa; tambahan di luar Figma).
 */
function StudentSwitcher({
  students,
  value,
  onValueChange,
  align = "start",
  addStudentTo,
}: {
  students: WaliStudent[]
  value: string
  onValueChange: (id: string) => void
  /* Perataan menu: "end" saat switcher di kanan Page header desktop */
  align?: "start" | "end"
  addStudentTo?: string
}) {
  const active = students.find((s) => s.id === value) ?? students[0]
  const pill =
    "inline-flex w-fit items-center gap-ns-s rounded-full border border-grayscale-border-default bg-grayscale-surface-default py-ns-2xs pr-ns-m pl-ns-2xs text-subtitle font-bold text-grayscale-text-title"

  const content = (
    <>
      <InitialsAvatar initials={active.initials} size="sm" />
      <span>
        {active.name} · {active.grade}
      </span>
    </>
  )

  if (students.length < 2 && !addStudentTo) {
    return <div className={pill}>{content}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Anak yang ditampilkan: ${active.name}. Ganti anak`}
        className={`${pill} outline-none hover:border-grayscale-border-darker focus-visible:ring-2 focus-visible:ring-primary-border-lighter data-popup-open:border-primary-border-default`}
      >
        {content}
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-auto min-w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tampilkan data anak</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(v) => onValueChange(v as string)}
          >
            {students.map((s) => (
              <DropdownMenuRadioItem
                key={s.id}
                value={s.id}
                className="min-h-12"
              >
                <InitialsAvatar initials={s.initials} size="sm" />
                <span className="flex flex-col leading-normal">
                  <span className="font-bold text-grayscale-text-title">
                    {s.name}
                  </span>
                  <span className="text-caption text-grayscale-text-caption">
                    {s.grade}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {addStudentTo && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="min-h-12 font-bold text-primary-text-primary"
              render={<Link to={addStudentTo} />}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-grayscale-surface-subtitle">
                <UserPlusIcon aria-hidden="true" />
              </span>
              Daftarkan anak
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { StudentSwitcher }
