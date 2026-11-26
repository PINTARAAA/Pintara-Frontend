import { at } from "@/lib/data/mock"
import type { Pair } from "@/types/jadwal-les"

/* ---------- Data contoh ---------- */

export const pairs: Pair[] = [
  {
    id: "pr-aisyah",
    student: { name: "Aisyah Putri", grade: "8", level: "SMP" },
    parentName: "Sari Wulandari",
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["Matematika", "IPA"],
    sessions: [
      { subject: "Matematika", day: "Rabu", start: "16.00", end: "17.30" },
      { subject: "IPA", day: "Jumat", start: "16.00", end: "17.30" },
    ],
    effectiveFrom: at(-19, 0),
  },
  {
    id: "pr-bima",
    student: { name: "Bima Saputra", grade: "12", level: "SMA" },
    parentName: "Lina Marlina",
    tutor: { id: "tt-dimas", name: "Kak Dimas Arya", shortName: "Kak Dimas" },
    subjects: ["Fisika"],
    sessions: [
      { subject: "Fisika", day: "Kamis", start: "18.30", end: "20.00" },
    ],
    effectiveFrom: at(-40, 0),
  },
  {
    id: "pr-rizky",
    student: { name: "Rizky Ananda", grade: "10", level: "SMA" },
    parentName: "Dewi Ananda",
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["Matematika", "IPA"],
    sessions: [
      { subject: "IPA", day: "Selasa", start: "18.30", end: "20.00" },
      { subject: "Matematika", day: "Sabtu", start: "18.30", end: "20.00" },
    ],
    effectiveFrom: at(-21, 0),
    offerId: "pw-0002",
  },
  {
    id: "pr-dimas",
    student: { name: "Dimas Pratama", grade: "9", level: "SMP" },
    parentName: "Arif Pratama",
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["IPA", "Matematika"],
    sessions: [{ subject: "IPA", day: "Senin", start: "16.00", end: "17.30" }],
    effectiveFrom: at(-20, 0),
    offerId: "pw-0004",
  },
  {
    id: "pr-fikri",
    student: { name: "Fikri Ramadhan", grade: "5", level: "SD" },
    parentName: "Sari Wulandari",
    tutor: {
      id: "tt-nadia",
      name: "Kak Nadia Safitri",
      shortName: "Kak Nadia",
    },
    subjects: ["Bahasa Inggris"],
    sessions: [
      { subject: "Bahasa Inggris", day: "Kamis", start: "15.00", end: "16.30" },
    ],
    effectiveFrom: at(-30, 0),
  },
]
