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
  "/tutor/jadwal": () => import("@/pages/jadwal/jadwal-tutor").then(toRoute),
  "/tutor/presensi": () => import("@/pages/presensi/presensi").then(toRoute),
  "/tutor/riwayat": () => import("@/pages/presensi/riwayat-tutor").then(toRoute),
  "/tutor/akun": () => import("@/pages/akun/akun-tutor").then(toRoute),
  "/pengelola/pendaftaran": () =>
    import("@/pages/verifikasi/verifikasi-pendaftaran").then(toRoute),
  "/pengelola/les": () => import("@/pages/pencocokan/les-pengelola").then(toRoute),
  "/pengelola/keuangan": () =>
    import("@/pages/tagihan/keuangan-pengelola").then(toRoute),
  "/pengelola/lainnya": () =>
    import("@/pages/akun/lainnya-pengelola").then(toRoute),
}

/* Layar turunan per peran (di luar tab navigasi) */
const EXTRA_ROUTES: Partial<Record<Role, RouteObject[]>> = {
  pengelola: [
    /* P2 · Verifikasi Pendaftaran */
    {
      path: "pendaftaran/:registrationId",
      handle: { title: "Detail Pendaftaran", hideBottomNav: true },
      lazy: () => import("@/pages/verifikasi/detail-pendaftaran").then(toRoute),
    },
    {
      path: "pendaftaran/:registrationId/tolak",
      handle: { title: "Tolak Pendaftaran", hideBottomNav: true },
      lazy: () => import("@/pages/verifikasi/tolak-pendaftaran").then(toRoute),
    },
    /* P3 · Pencocokan Tutor (?sebagian=1 → kecocokan sebagian) */
    {
      path: "les/pencocokan/:registrationId",
      handle: { title: "Cocokkan Tutor", hideBottomNav: true },
      lazy: () => import("@/pages/pencocokan/cocokkan-tutor").then(toRoute),
    },
    /* P4 · Penawaran Tutor */
    {
      path: "les/penawaran/:registrationId/buat",
      handle: { title: "Buat Penawaran", hideBottomNav: true },
      lazy: () => import("@/pages/penawaran/buat-penawaran").then(toRoute),
    },
    {
      path: "les/penawaran/:offerId",
      handle: { title: "Detail Penawaran", hideBottomNav: true },
      lazy: () => import("@/pages/penawaran/detail-penawaran").then(toRoute),
    },
    {
      path: "les/penawaran/:offerId/ditolak",
      handle: { title: "Catat Penolakan", hideBottomNav: true },
      lazy: () => import("@/pages/penawaran/catat-penolakan").then(toRoute),
    },
    /* P5 · Atur Jadwal Les */
    {
      path: "les/jadwal/atur/:offerId",
      handle: { title: "Atur Jadwal Les", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal-les/atur-jadwal").then(toRoute),
    },
    {
      path: "les/jadwal/:pairId/ubah",
      handle: { title: "Atur Jadwal Les", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal-les/atur-jadwal").then(toRoute),
    },
    {
      path: "les/jadwal/pengajuan/:requestId",
      handle: { title: "Pengajuan Perubahan", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal-les/tinjau-pengajuan").then(toRoute),
    },
    /* P6 · Verifikasi Final Presensi (?bulan=YYYY-MM) */
    {
      path: "presensi",
      handle: { title: "Verifikasi Presensi", hideBottomNav: true },
      lazy: () => import("@/pages/presensi/verifikasi-presensi").then(toRoute),
    },
    {
      path: "presensi/keberatan/:sessionId",
      handle: { title: "Tinjau Keberatan", hideBottomNav: true },
      lazy: () => import("@/pages/presensi/tinjau-keberatan").then(toRoute),
    },
    /* P7 · Rekap & Pembayaran Honor (:month = YYYY-MM) */
    {
      path: "keuangan/honor/:month/:tutorId",
      handle: { title: "Rincian Honor", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/rincian-honor").then(toRoute),
    },
    {
      path: "keuangan/honor/:month/:tutorId/bayar",
      handle: { title: "Catat Pembayaran", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/catat-pembayaran-honor").then(toRoute),
    },
    /* P8 · Laporan Keuangan (?bulan=YYYY-MM) */
    {
      path: "laporan-keuangan",
      handle: { title: "Laporan Keuangan", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/laporan-keuangan").then(toRoute),
    },
    {
      path: "laporan-keuangan/tagihan",
      handle: { title: "Tagihan Siswa", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/tagihan-siswa").then(toRoute),
    },
    {
      path: "laporan-keuangan/tagihan/:billId",
      handle: { title: "Rincian Tagihan", hideBottomNav: true },
      lazy: () => import("@/pages/tagihan/rincian-tagihan-siswa").then(toRoute),
    },
    {
      path: "laporan-keuangan/tagihan/:billId/bayar",
      handle: { title: "Catat Pembayaran", hideBottomNav: true },
      lazy: () =>
        import("@/pages/tagihan/catat-pembayaran-tagihan").then(toRoute),
    },
    /* P9 · Data Tutor & Siswa (?q=…&mapel=…&lokasi=…&status=…) */
    {
      path: "tutor",
      handle: { title: "Data Tutor", hideBottomNav: true },
      lazy: () => import("@/pages/data-master/data-tutor").then(toRoute),
    },
    {
      path: "tutor/tambah",
      handle: { title: "Tambah Tutor", hideBottomNav: true },
      lazy: () => import("@/pages/data-master/form-tutor").then(toRoute),
    },
    {
      path: "tutor/:tutorId",
      handle: { title: "Profil Tutor", hideBottomNav: true },
      lazy: () => import("@/pages/data-master/profil-tutor").then(toRoute),
    },
    {
      path: "tutor/:tutorId/ubah",
      handle: { title: "Ubah Profil Tutor", hideBottomNav: true },
      lazy: () => import("@/pages/data-master/form-tutor").then(toRoute),
    },
    {
      path: "siswa",
      handle: { title: "Data Siswa", hideBottomNav: true },
      lazy: () => import("@/pages/data-master/data-siswa").then(toRoute),
    },
    {
      path: "siswa/:studentId",
      handle: { title: "Profil Siswa", hideBottomNav: true },
      lazy: () => import("@/pages/data-master/profil-siswa").then(toRoute),
    },
    /* P10 · Manajemen Akun (?peran=wali|tutor|pengelola&q=…) */
    {
      path: "akun",
      handle: { title: "Manajemen Akun", hideBottomNav: true },
      lazy: () => import("@/pages/manajemen-akun/manajemen-akun").then(toRoute),
    },
    {
      path: "akun/tambah",
      handle: { title: "Tambah Akun", hideBottomNav: true },
      lazy: () => import("@/pages/manajemen-akun/form-akun").then(toRoute),
    },
    {
      path: "akun/:accountId",
      handle: { title: "Detail Akun", hideBottomNav: true },
      lazy: () => import("@/pages/manajemen-akun/detail-akun").then(toRoute),
    },
    {
      path: "akun/:accountId/ubah",
      handle: { title: "Ubah Data Akun", hideBottomNav: true },
      lazy: () => import("@/pages/manajemen-akun/form-akun").then(toRoute),
    },
    /* P11 · Rekap & Riwayat Les (?tab=…&bulan=YYYY-MM&tutor=…&siswa=…) */
    {
      path: "riwayat",
      handle: { title: "Rekap & Riwayat Les", hideBottomNav: true },
      lazy: () => import("@/pages/rekap-les/rekap-les").then(toRoute),
    },
    /* P12 · Pengaturan Notifikasi */
    {
      path: "pengaturan-notifikasi",
      handle: { title: "Pengaturan Notifikasi", hideBottomNav: true },
      lazy: () =>
        import("@/pages/pengaturan-notifikasi/pengaturan-notifikasi").then(
          toRoute
        ),
    },
    {
      path: "pengaturan-notifikasi/:settingId",
      handle: { title: "Ubah Notifikasi", hideBottomNav: true },
      lazy: () =>
        import("@/pages/pengaturan-notifikasi/ubah-notifikasi").then(toRoute),
    },
    /* P13 · Riwayat Notifikasi (?status=…&jenis=…&periode=…) */
    {
      path: "riwayat-notifikasi",
      handle: { title: "Riwayat Notifikasi", hideBottomNav: true },
      lazy: () =>
        import("@/pages/riwayat-notifikasi/riwayat-notifikasi").then(toRoute),
    },
    {
      path: "riwayat-notifikasi/:logId",
      handle: { title: "Detail Notifikasi", hideBottomNav: true },
      lazy: () =>
        import("@/pages/riwayat-notifikasi/detail-notifikasi").then(toRoute),
    },
    /* P14 · Notifikasi */
    {
      path: "notifikasi",
      handle: { title: "Notifikasi", hideBottomNav: true },
      lazy: () => import("@/pages/notifikasi/notifikasi-pengelola").then(toRoute),
    },
    /*
     * SEMENTARA: layar yang belum dibuat memakai placeholder —
     * perbaiki data (P2) dan tambah/ubah siswa (belum ada di Figma P9)
     */
    ...[
      ["pendaftaran/:registrationId/ubah", "Perbaiki Data"],
      ["siswa/tambah", "Tambah Siswa"],
      ["siswa/:studentId/ubah", "Ubah Profil Siswa"],
    ].map(([path, title]) => ({
      path,
      handle: { title, hideBottomNav: true },
      lazy: placeholderDetail,
    })),
  ],
  tutor: [
    /* T7 · Notifikasi */
    {
      path: "notifikasi",
      handle: { title: "Notifikasi", hideBottomNav: true },
      lazy: () => import("@/pages/notifikasi/notifikasi-tutor").then(toRoute),
    },
    /* T5 · Jadwal */
    {
      path: "jadwal/:sessionId",
      handle: { title: "Detail Jadwal", hideBottomNav: true },
      lazy: () => import("@/pages/jadwal/detail-jadwal-tutor").then(toRoute),
    },
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
