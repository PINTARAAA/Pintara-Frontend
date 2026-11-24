import type * as React from "react"
import { createBrowserRouter } from "react-router"

import { PageLoader } from "@/app/page-loader"
import RouteError from "@/app/routes/error"

/*
 * Daftar route aplikasi.
 *
 * Tiap halaman di-lazy-load (`lazy`) agar hanya diunduh saat dibuka.
 * File route meng-export default komponennya; `toRoute` mengubahnya ke
 * bentuk yang diminta react-router ({ Component }).
 *
 * Menambah halaman:
 *   { path: "pendaftaran", lazy: () => import("@/app/routes/pendaftaran").then(toRoute) }
 */
const toRoute = (module: { default: React.ComponentType }) => ({
  Component: module.default,
})

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        index: true,
        lazy: () => import("@/app/routes/home").then(toRoute),
      },
      {
        path: "*",
        lazy: () => import("@/app/routes/not-found").then(toRoute),
      },
    ],
  },
])
