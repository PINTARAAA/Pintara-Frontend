import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { ListItem } from "@/components"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarNavItem } from "@/components/ui/sidebar"
import { useTheme, type Theme } from "@/app/theme-context"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"

/*
 * Pilihan tema (di luar Figma): Terang · Gelap · Ikuti sistem. Disimpan
 * di localStorage ("pintara-theme"), lihat src/app/theme.tsx.
 *
 * ThemeSetting      : seksi "Tampilan" di layar Akun (W8 · T6), di atas Bantuan.
 * SidebarThemeItem  : item "Tema" di grup bawah sidebar Pengelola, di atas
 *                     Keluar (Pengelola tidak punya layar Akun sendiri).
 */
const OPTIONS = [
  { value: "light", label: "Terang", icon: SunIcon },
  { value: "dark", label: "Gelap", icon: MoonIcon },
  { value: "system", label: "Ikuti sistem", icon: MonitorIcon },
] as const

function useThemeOption() {
  const { theme, setTheme } = useTheme()
  const active = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2]
  return { active, setTheme }
}

function ThemeMenuContent({
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent> & {
  value: string
  onValueChange: (value: Theme) => void
}) {
  return (
    <DropdownMenuContent className="w-auto min-w-48" {...props}>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Tema tampilan</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onValueChange(v as Theme)}
        >
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="min-h-12"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )
}

function ThemeSetting() {
  const { active, setTheme } = useThemeOption()
  const Icon = active.icon

  return (
    <DashboardSection title="Tampilan">
      <DashboardList>
        <DropdownMenu>
          <ListItem
            icon={<Icon />}
            title="Tema"
            description={active.label}
            chevron
            render={<DropdownMenuTrigger />}
          />
          <ThemeMenuContent
            align="end"
            value={active.value}
            onValueChange={setTheme}
          />
        </DropdownMenu>
      </DashboardList>
    </DashboardSection>
  )
}

function SidebarThemeItem() {
  const { active, setTheme } = useThemeOption()
  const Icon = active.icon

  return (
    <DropdownMenu>
      <SidebarNavItem
        icon={<Icon />}
        label={`Tema: ${active.label}`}
        className="text-left"
        render={<DropdownMenuTrigger />}
      />
      <ThemeMenuContent
        side="right"
        align="end"
        value={active.value}
        onValueChange={setTheme}
      />
    </DropdownMenu>
  )
}

export { ThemeSetting, SidebarThemeItem }
