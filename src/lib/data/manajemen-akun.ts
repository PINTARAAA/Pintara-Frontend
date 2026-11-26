import { studentDirectory, tutorDirectory } from "@/lib/data/data-master"
import { at } from "@/lib/data/mock"
import type { AccountStatus } from "@/types/data-master"
import type { Account } from "@/types/manajemen-akun"

export const usernameOf = (name: string) =>
  name
    .replace(/^Kak\s+/, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".")

/* ---------- Data contoh ---------- */

export const accounts: Account[] = []

;(() => {
  const wali: [string, string, string[], AccountStatus, string?][] = [
    ["Sari Wulandari", "0812-3456-7890", ["sw-aisyah"], "aktif"],
    ["Hendra Wijaya", "0852-7788-9900", ["sw-bayu"], "aktif"],
    ["Rina Kartika", "0878-1100-2299", ["sw-salma", "sw-nadia"], "aktif"],
    ["Andi Saputra", "0813-4400-1122", [], "aktif"],
    ["Dewi Lestari", "0857-2211-3344", ["sw-rafi"], "nonaktif", "dewi.l@gmail.com"],
  ]
  wali.forEach(([name, phone, studentIds, status, email], i) =>
    accounts.push({
      id: `ak-wali-${i + 1}`,
      role: "wali",
      name,
      email: email ?? `${usernameOf(name)}@gmail.com`,
      username: usernameOf(name),
      phone,
      createdAt: at(-24 - i * 9, 9),
      lastLoginAt: i === 0 ? at(0, 11, 5) : status === "aktif" ? at(-i, 19, 30) : null,
      status,
      studentIds,
    })
  )

  /* Isi sampai 84 akun wali, ditautkan ke siswa yang tersisa */
  const first = ["Agus", "Bambang", "Dian", "Eka", "Fitri", "Gita", "Heri", "Indah", "Joko", "Kartini", "Lukman", "Maya"]
  const last = ["Setiawan", "Irawan", "Kartika", "Prasetyo", "Susanti", "Wahyudi", "Rahayu"]
  const linked = new Set(accounts.flatMap((a) => a.studentIds))
  const free = studentDirectory().filter((s) => !linked.has(s.id))
  for (let i = accounts.length; i < 84; i++) {
    const name = `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`
    const student = free[i]
    accounts.push({
      id: `ak-wali-${i + 1}`,
      role: "wali",
      name,
      email: `${usernameOf(name)}@gmail.com`,
      username: usernameOf(name),
      phone: `0812-${String(4000 + i * 29).slice(0, 4)}-${String(6000 + i * 13).slice(0, 4)}`,
      createdAt: at(-60 - i, 10),
      lastLoginAt: at(-(i % 14), 20),
      status: i >= 80 ? "nonaktif" : "aktif",
      studentIds: student ? [student.id] : [],
    })
  }

  for (const t of tutorDirectory()) {
    accounts.push({
      id: `ak-${t.id}`,
      role: "tutor",
      name: t.name,
      email: t.email,
      username: usernameOf(t.name),
      phone: t.phone,
      createdAt: t.joinedAt,
      lastLoginAt: t.status === "aktif" ? at(-1, 15, 40) : null,
      status: t.status,
      studentIds: [],
    })
  }

  accounts.push(
    {
      id: "ak-pengelola-1",
      role: "pengelola",
      name: "Ibu Ratna Sari",
      email: "ratna.pintara@gmail.com",
      username: "ratna.sari",
      phone: "0811-3000-1001",
      createdAt: new Date(2023, 5, 1),
      lastLoginAt: at(0, 7, 45),
      status: "aktif",
      studentIds: [],
    },
    {
      id: "ak-pengelola-2",
      role: "pengelola",
      name: "Pak Fahmi Ramadhan",
      email: "fahmi.pintara@gmail.com",
      username: "fahmi.ramadhan",
      phone: "0811-3000-1002",
      createdAt: new Date(2024, 1, 12),
      lastLoginAt: at(-2, 16, 10),
      status: "aktif",
      studentIds: [],
    }
  )
})()
