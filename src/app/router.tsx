import type * as React from "react"
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from "react-router"

import { ROLE_NAV, type Role } from "@/app/navigation"
import { PageLoader } from "@/app/page-loader"
import RouteError from "@/pages/error/error"
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
  wali: () => import("@/pages/dashboard/beranda-wali").then(toRoute),
  tutor: () => import("@/pages/dashboard/beranda-tutor").then(toRoute),
  pengelola: () => import("@/pages/dashboard/beranda-pengelola").then(toRoute),
}
const placeholderDetail = () =>
  import("@/app/routes/placeholder-detail").then(toRoute)

/* Layar tab yang sudah dibangun (sisanya memakai placeholder), kunci = path tab */
const TAB_SCREENS: Record<string, () => Promise<{ Component: React.ComponentType }>> = {
  "/wali/jadwal": () => import("@/pages/jadwal/jadwal-les").then(toRoute),
  "/wali/absensi": () =>
    import("@/pages/absensi/validasi-absensi").then(toRoute),
  "/wali/tagihan": () => import("@/pages/tagihan/tagihan").then(toRoute),
  "/wali/akun": () => import("@/pages/akun/akun-wali").then(toRoute),
  "/tutor/presensi": () => import("@/pages/presensi/presensi").then(toRoute),
}

/* Layar turunan per peran (di luar tab navigasi) */
const EXTRA_ROUTES: Partial<Record<Role, RouteObject[]>> = {
  tutor: [
    /* T2 · Presensi & Dokumentasi */
    /* T3 · Status Presensi (?bulan=YYYY-MM) */
    {
      path: "presensi/status",
      handle: { title: "Status Presensi", hideBottomNav: true },
      lazy: () => import("@/pages/presensi/status-presensi").then(toRoute),
    },
    {
      path: "presensi/status/:sessionId",
      handle: { title: "Detail Presensi", hideBottomNav: true },
      lazy: () => import("@/pages/presensi/detail-presensi").then(toRoute),
    },
    {
      path: "presensi/:sessionId",
      handle: { title: "Isi Presensi", hideBottomNav: true },
      lazy: () => import("@/pages/presensi/isi-presensi").then(toRoute),
    },
  ],
  wali: [
    /* W9 · Notifikasi */
    {
      path: "notifikasi",
      handle: { title: "Notifikasi", hideBottomNav: true },
      lazy: () => import("@/pages/notifikasi/notifikasi-wali").then(toRoute),
    },
    /* W7 · Riwayat Les */
    {
      path: "riwayat",
      handle: { title: "Riwayat Les", hideBottomNav: true },
      lazy: () => import("@/pages/absensi/riwayat-les").then(toRoute),
    },
    {
      path: "riwayat/:sessionId",
      handle: { title: "Detail Sesi", hideBottomNav: true },
      lazy: () => import("@/pages/absensi/detail-riwayat").then(toRoute),
    },
    /* W6 · Tagihan & Pembayaran */
    {
      path: "tagihan/:billId",
      handle: { title: "Detail Tagihan", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/detail-tagihan").then(toRoute),
    },
    {
      path: "tagihan/:billId/bayar",
      handle: { title: "Pembayaran", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/bayar-tagihan").then(toRoute),
    },
    /* W5 · Validasi Absensi & Ulasan */
    {
      path: "absensi/:sessionId",
      handle: { title: "Detail Sesi", hideBottomNav: true },
      lazy: () => import("@/pages/absensi/detail-sesi").then(toRoute),
    },
    {
      path: "absensi/:sessionId/keberatan",
      handle: { title: "Ajukan Keberatan", hideBottomNav: true },
      lazy: () => import("@/pages/absensi/ajukan-keberatan").then(toRoute),
    },
    {
      path: "absensi/:sessionId/ulasan",
      handle: { title: "Beri Ulasan", hideBottomNav: true },
      lazy: () => import("@/pages/absensi/beri-ulasan").then(toRoute),
    },
    /* W4 · Jadwal Les & Perubahan Jadwal */
    {
      path: "jadwal/pengajuan/:requestId",
      handle: { title: "Pengajuan Perubahan", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal/detail-pengajuan").then(toRoute),
    },
    {
      path: "jadwal/:routineId",
      handle: { title: "Detail Jadwal", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal/detail-jadwal").then(toRoute),
    },
    {
      path: "jadwal/:routineId/ubah",
      handle: { title: "Ajukan Perubahan", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal/ajukan-perubahan").then(toRoute),
    },
    {
      /* W2 · Pendaftaran Siswa */
      path: "pendaftaran",
      handle: { title: "Daftar Siswa Baru", hideBottomNav: true },
      lazy: () =>
        import("@/pages/pendaftaran/pendaftaran-siswa").then(toRoute),
    },
    {
      /* W3 · Status Pendaftaran (?id=… untuk pendaftaran tertentu) */
      path: "pendaftaran/status",
      handle: { title: "Status Pendaftaran", hideBottomNav: true },
      lazy: () =>
        import("@/pages/pendaftaran/status-pendaftaran").then(toRoute),
    },
  ],
}

const PLACEHOLDER_DETAILS: RouteObject[] = [
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
]

/* Route satu peran: semua layarnya di dalam AppShell */
function roleRoutes(role: Role): RouteObject {
  const { main, utility } = ROLE_NAV[role]
  const [home, ...tabs] = [...main, ...utility]
  const extras = EXTRA_ROUTES[role] ?? []
  return {
    path: role,
    element: <AppShell items={main} utilityItems={utility} />,
    children: [
      { index: true, handle: { title: home.label }, lazy: beranda[role] },
      ...tabs.map((tab) => ({
        path: tab.to.replace(`/${role}/`, ""),
        handle: { title: tab.label },
        lazy: TAB_SCREENS[tab.to] ?? placeholder,
      })),
      ...extras,
      /* SEMENTARA: layar detail yang belum dibangun (dilewati bila sudah ada) */
      ...PLACEHOLDER_DETAILS.filter(
        (p) => !extras.some((route) => route.path === p.path)
      ),
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
        lazy: () => import("@/pages/auth/login").then(toRoute),
      },
      roleRoutes("wali"),
      roleRoutes("tutor"),
      roleRoutes("pengelola"),
      {
        path: "*",
        lazy: () => import("@/pages/error/not-found").then(toRoute),
      },
    ],
  },
])
