import type {
  LbbContact,
  PengelolaMenu,
  TutorAccount,
  WaliAccount,
} from "@/types/akun"

/* ---------- Data contoh ---------- */

export const LBB_CONTACT: LbbContact = {
  name: "Kak Ila",
  whatsapp: "6281200001122",
  display: "0812-0000-1122",
}

export const APP_VERSION = "1.0.0"

export const WALI_ACCOUNT: WaliAccount = {
  name: "Sari Wulandari",
  initials: "SW",
  role: "Wali Murid",
  email: "sari.wulandari@gmail.com",
  whatsapp: "0812-3456-7890",
  username: "sari.wulandari",
  students: [
    {
      id: "s1",
      name: "Aisyah Putri",
      grade: "Kelas 8 SMP",
      subjects: ["Matematika", "IPA"],
    },
    {
      id: "s2",
      name: "Fikri Ramadhan",
      grade: "Kelas 5 SD",
      subjects: ["Bahasa Inggris"],
    },
  ],
  lbbContact: LBB_CONTACT,
  appVersion: APP_VERSION,
}

export const TUTOR_ACCOUNT: TutorAccount = {
  name: "Kak Budi Santoso",
  initials: "BS",
  role: "Tutor",
  email: "budi.santoso@gmail.com",
  teaching: {
    subjects: ["Matematika", "IPA"],
    levels: "SMP–SMA",
    availability: "Senin–Sabtu, 15.00–21.00",
    rate: 60_000,
  },
  lbbContact: LBB_CONTACT,
  appVersion: APP_VERSION,
}

export const PENGELOLA_MENU: PengelolaMenu = {
  name: "Nurul Laila (Kak Ila)",
  initials: "NL",
  role: "Pengelola LBB",
  email: "ila@jelajahilmu.id",
  tutors: { total: 70, active: 64 },
  students: { total: 100, active: 92 },
  failedNotifications: 2,
}
