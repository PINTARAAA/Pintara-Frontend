import type * as React from "react"
import { useLoaderData, useRouteLoaderData } from "react-router"

import { AppShell } from "@/components"
import { SidebarLogoutItem } from "@/features/akun/components/account-help"
import { SidebarThemeItem } from "@/features/akun/components/theme-setting"
import type { Role } from "@/types/auth"

import { ROLE_NAV, ROLE_SIDEBAR } from "../navigation"

export type HomeData = { role: Role; Component: React.ComponentType }

export function RoleShell({ role }: { role: Role }) {
  const { main, utility, sidebarExtra } = ROLE_NAV[role]
  const sidebar = ROLE_SIDEBAR[role]
  return (
    <AppShell
      items={main}
      utilityItems={utility}
      sidebarItems={[...main, ...(sidebarExtra?.main ?? [])]}
      sidebarUtilityList={[...(sidebarExtra?.utility ?? []), ...utility]}
      sidebarGroups={sidebar?.groups}
      sidebarUtilityItems={sidebar?.utility}
      sidebarUtilityLead={!sidebar && <SidebarThemeItem />}
      sidebarFooter={
        sidebar && (
          <>
            <SidebarThemeItem />
            <SidebarLogoutItem description={sidebar.logoutDescription} />
          </>
        )
      }
    />
  )
}

export function HomeLayout() {
  const { role } = useLoaderData() as HomeData
  return <RoleShell role={role} />
}

export function HomeIndex() {
  const { Component } = useRouteLoaderData("home") as HomeData
  return <Component />
}
