import type { AuthUser } from "@/types/auth"

export type DemoAccount = AuthUser & { active: boolean }

export const DEMO_PASSWORD = "pintara123"

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  wali: { name: "Sari Wulandari", role: "wali", active: true },
  tutor: { name: "Budi Santoso", role: "tutor", active: true },
  pengelola: { name: "Pengelola LBB", role: "pengelola", active: true },
  nonaktif: { name: "Akun Nonaktif", role: "wali", active: false },
}
