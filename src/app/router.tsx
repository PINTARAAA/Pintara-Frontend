import type * as React from "react"
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from "react-router"

import { ROLE_NAV, type Role } from "@/app/navigation"
import { PageLoader } from "@/app/page-loader"
import RouteError from "@/app/routes/error"
import { AppFrame } from "@/components/layouts/app-frame"
import { AppShell } from "@/components/layouts/app-shell"

/*
 * Daftar route aplikasi.
 *
 *   /masuk                      → AuthLayout
 *   /:peran/…  (wali, tutor, pengelola) → AppShell
 *     ├─ layar tab              → bottom nav (mobile) / sidebar (desktop)
 *     └─ layar detail/formulir  → handle.hideBottomNav: tanpa bottom nav di
 *                                 mobile, sidebar tetap tampil di desktop
 *
 * Tiap halaman di-lazy-load agar hanya diunduh saat dibuka. File route
 * meng-export default komponennya; `toRoute` mengubahnya ke { Component }.
 */
const toRoute = (module: { default: React.ComponentType }) => ({
  Component: module.default,
})

const placeholder = () => import("@/app/routes/placeholder").then(toRoute)
const beranda: Record<Role, () => Promise<{ Component: React.ComponentType }>> = {
  wali: () => import("@/app/routes/beranda-wali").then(toRoute),
  tutor: () => import("@/app/routes/beranda-tutor").then(toRoute),
  pengelola: () => import("@/app/routes/beranda-pengelola").then(toRoute),
}
const placeholderDetail = () =>
  import("@/app/routes/placeholder-detail").then(toRoute)

/* Route satu peran: semua layarnya di dalam AppShell */
function roleRoutes(role: Role): RouteObject {
  const { main, utility } = ROLE_NAV[role]
  const [home, ...tabs] = [...main, ...utility]
  return {
    path: role,
    element: <AppShell items={main} utilityItems={utility} />,
    children: [
      { index: true, handle: { title: home.label }, lazy: beranda[role] },
      ...tabs.map((tab) => ({
        path: tab.to.replace(`/${role}/`, ""),
        handle: { title: tab.label },
        lazy: placeholder,
      })),
      /* SEMENTARA: layar detail yang belum dibangun */
      {
        path: "notifikasi",
        handle: { title: "Notifikasi", hideBottomNav: true },
        lazy: placeholderDetail,
      },
      {
        path: "contoh",
        handle: { title: "Contoh Detail", hideBottomNav: true },
        lazy: placeholderDetail,
      },
    ],
  }
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppFrame>
        <Outlet />
      </AppFrame>
    ),
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { index: true, element: <Navigate to="/masuk" replace /> },
      {
        path: "masuk",
        lazy: () => import("@/app/routes/login").then(toRoute),
      },
      roleRoutes("wali"),
      roleRoutes("tutor"),
      roleRoutes("pengelola"),
      {
        path: "*",
        lazy: () => import("@/app/routes/not-found").then(toRoute),
      },
    ],
  },
])
