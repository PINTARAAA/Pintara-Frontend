import { at } from "@/lib/data/mock"
import type { DeclineReason, Offer } from "@/types/penawaran"

export const DECLINE_REASONS: { value: DeclineReason; label: string }[] = [
  { value: "jadwal_bentrok", label: "Jadwal bentrok" },
  { value: "lokasi_jauh", label: "Lokasi terlalu jauh" },
  { value: "tidak_menguasai", label: "Tidak menguasai materi atau jenjang" },
  { value: "lainnya", label: "Lainnya" },
]

/* ---------- Data contoh ---------- */

export const offers: Offer[] = [
  {
    id: "pw-0007",
    registrationId: "reg-0112",
    student: { name: "Salma Azzahra", grade: "7", level: "SMP" },
    tutor: {
      id: "tt-nadia",
      name: "Kak Nadia Safitri",
      shortName: "Kak Nadia",
    },
    subjects: ["Bahasa Inggris"],
    schedule: "Selasa & Jumat, 15.00",
    location: "Jl. Raya Tanjung Bumi",
    distanceKm: 1.8,
    rate: 50_000,
    sentAt: at(-4, 10, 0),
    status: "ditolak",
    answeredAt: at(-4, 16, 30),
    decline: {
      reason: "jadwal_bentrok",
      note: "Kak Nadia hanya bisa mengajar hari Jumat.",
    },
  },
  {
    id: "pw-0004",
    registrationId: "reg-0109",
    student: { name: "Dimas Pratama", grade: "9", level: "SMP" },
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["IPA", "Matematika"],
    schedule: "Senin & Kamis, 16.00",
    location: "Perum Kraton Indah",
    distanceKm: 2.6,
    rate: 60_000,
    sentAt: at(-22, 14, 0),
    status: "diterima",
    answeredAt: at(-22, 19, 10),
  },
  {
    id: "pw-0002",
    registrationId: "reg-0098",
    student: { name: "Rizky Ananda", grade: "10", level: "SMA" },
    tutor: { id: "tt-budi", name: "Kak Budi Santoso", shortName: "Kak Budi" },
    subjects: ["Matematika", "IPA"],
    schedule: "Selasa & Sabtu, 18.30",
    location: "Jl. Soekarno-Hatta",
    distanceKm: 3.2,
    rate: 60_000,
    sentAt: at(-24, 9, 0),
    status: "diterima",
    answeredAt: at(-23, 11, 20),
  },
]
