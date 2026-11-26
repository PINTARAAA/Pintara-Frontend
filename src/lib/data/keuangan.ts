import { format, setDate, startOfMonth, subMonths } from "date-fns"

import { at } from "@/lib/data/mock"
import type { BillItem } from "@/types/tagihan"
import type {
  BillPayment,
  BillPaymentMethod,
  HonorPaymentMethod,
  Recap,
  StudentBill,
  TutorHonor,
  TutorProfile,
} from "@/types/keuangan"

/* ================= Honor ================= */

export const tutorProfiles: TutorProfile[] = [
  {
    id: "tt-budi",
    name: "Kak Budi Santoso",
    shortName: "Kak Budi",
    rate: 60_000,
    method: "tunai",
    methodNote: "Diambil langsung tiap awal bulan",
  },
  {
    id: "tt-laila",
    name: "Kak Laila Fitri",
    shortName: "Kak Laila",
    rate: 60_000,
    method: "transfer",
  },
  {
    id: "tt-dimas",
    name: "Kak Dimas Arya",
    shortName: "Kak Dimas",
    rate: 60_000,
    method: "transfer",
  },
  {
    id: "tt-nadia",
    name: "Kak Nadia Safitri",
    shortName: "Kak Nadia",
    rate: 50_000,
    method: "transfer",
  },
  {
    id: "tt-yoga",
    name: "Kak Yoga Pratama",
    shortName: "Kak Yoga",
    rate: null,
    method: "transfer",
  },
]

export function buildHonor(
  profile: TutorProfile,
  bySubject: Record<string, number>
): TutorHonor {
  const rate = profile.rate ?? 0
  const lines = Object.entries(bySubject)
    .filter(([, n]) => n > 0)
    .map(([subject, sessions]) => ({
      subject,
      sessions,
      rate,
      amount: sessions * rate,
    }))
  return {
    tutorId: profile.id,
    name: profile.name,
    shortName: profile.shortName,
    lines,
    sessions: lines.reduce((acc, l) => acc + l.sessions, 0),
    total: lines.reduce((acc, l) => acc + l.amount, 0),
    method: profile.method,
    methodNote: profile.methodNote,
  }
}

/* ---------- Data contoh: rekap bulan lalu sudah dibayar semua ---------- */

export const recaps = new Map<string, Recap>()

;(() => {
  const october = subMonths(startOfMonth(new Date()), 1)
  const seed: [string, Record<string, number>, HonorPaymentMethod, Date][] = [
    ["tt-budi", { Matematika: 7, IPA: 6 }, "tunai", at(-24, 10)],
    ["tt-laila", { Matematika: 54 }, "transfer", at(-23, 9)],
    ["tt-dimas", { Fisika: 26, Matematika: 25 }, "transfer", at(-23, 9)],
    ["tt-nadia", { "Bahasa Inggris": 40 }, "transfer", at(-23, 9)],
  ]
  recaps.set(format(startOfMonth(october), "yyyy-MM"), {
    month: october,
    calculatedAt: at(-25, 8, 30),
    skipped: [],
    sessionsByTutor: {},
    honors: seed.map(([id, bySubject, method, paidAt]) => {
      const profile = tutorProfiles.find((t) => t.id === id)!
      const honor = buildHonor(profile, bySubject)
      honor.payment = {
        amount: honor.total,
        method,
        paidAt,
        proof: {
          name: `bukti_honor_${profile.shortName.split(" ")[1].toLowerCase()}_okt.jpg`,
          size: 640_000,
        },
        recordedAt: paidAt,
      }
      return honor
    }),
  })
})()

/* ================= Laporan ================= */

const FIRST = [
  "Aisyah", "Bayu", "Salma", "Rizky", "Nabila", "Fajar", "Citra", "Dimas",
  "Kirana", "Raka", "Alya", "Farel", "Zahra", "Galih", "Intan", "Yusuf",
  "Nadia", "Hafiz", "Keisha", "Arka", "Tiara", "Rafi", "Amira", "Bima",
]
const LAST = [
  "Putri", "Saputra", "Azzahra", "Ananda", "Pratama", "Maharani", "Wijaya",
  "Lestari", "Nugroho", "Rahmawati", "Hidayat", "Permata",
]
const GUARDIANS = [
  "Sari Wulandari", "Hendra Saputra", "Rina Marlina", "Agus Setiawan",
  "Dewi Anggraini", "Bambang Irawan", "Yuni Kartika", "Teguh Prasetyo",
]
const TEMPLATES: BillItem[][] = [
  [
    { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
    { subject: "IPA", sessions: 4, unitPrice: 52_500 },
  ],
  [{ subject: "Matematika", sessions: 8, unitPrice: 60_000 }],
  [
    { subject: "Bahasa Inggris", sessions: 4, unitPrice: 50_000 },
    { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
  ],
  [{ subject: "Fisika", sessions: 8, unitPrice: 67_500 }],
  [
    { subject: "Matematika", sessions: 4, unitPrice: 60_000 },
    { subject: "Fisika", sessions: 4, unitPrice: 67_500 },
  ],
  [{ subject: "Bahasa Inggris", sessions: 8, unitPrice: 50_000 }],
]
const GATEWAY: BillPaymentMethod[] = ["QRIS", "VA BCA", "GoPay"]

export const bills: StudentBill[] = []

function billTotalOf(items: BillItem[]) {
  return items.reduce((sum, i) => sum + i.sessions * i.unitPrice, 0)
}

function buildMonth(period: Date, opts: { unpaid: number; partial: number }) {
  const ym = format(period, "yyyy-MM")
  const due = setDate(period, 10)
  const created: StudentBill[] = []
  let seq = 1
  const add = (
    studentName: string,
    items: BillItem[],
    payments: Omit<BillPayment, "id">[],
    guardianName = GUARDIANS[seq % GUARDIANS.length]
  ) => {
    const number = `INV-${ym}-${String(seq).padStart(4, "0")}`
    created.push({
      id: `${ym}-${seq}`,
      number,
      studentName,
      guardianName,
      period,
      dueDate: due,
      items,
      payments: payments.map((p, i) => ({ ...p, id: `TRX-${ym}-${seq}-${i}` })),
    })
    seq++
  }
  const on = (day: number, hour = 19) =>
    new Date(period.getFullYear(), period.getMonth(), day, hour, 10)

  /* Baris yang sama dengan contoh di Figma */
  add("Bayu Saputra", [{ subject: "Matematika", sessions: 8, unitPrice: 50_000 }], [], "Hendra Saputra")
  add("Salma Azzahra", [{ subject: "Matematika", sessions: 4, unitPrice: 60_000 }], [], "Rina Marlina")
  add("Aisyah Putri", TEMPLATES[0], [
    { amount: 300_000, method: "VA BCA", status: "kedaluwarsa", createdAt: on(11, 8) },
    { amount: 300_000, method: "QRIS", status: "berhasil", createdAt: on(12) },
  ], "Sari Wulandari")
  add("Rizky Ananda", [{ subject: "Fisika", sessions: 8, unitPrice: 67_500 }], [
    { amount: 340_000, method: "GoPay", status: "berhasil", createdAt: on(9) },
  ], "Agus Setiawan")

  const fixedUnpaid = 2
  const fixedPartial = 2
  const total = 84
  for (let i = created.length; i < total; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`
    const items = TEMPLATES[i % TEMPLATES.length]
    const amount = billTotalOf(items)
    const method = GATEWAY[i % GATEWAY.length]
    const unpaidLeft = opts.unpaid - fixedUnpaid
    const partialLeft = opts.partial - fixedPartial
    const idx = i - 4
    if (idx < unpaidLeft) {
      add(name, items, i % 3 === 0
        ? [{ amount, method, status: "gagal", createdAt: on(8) }]
        : [])
    } else if (idx < unpaidLeft + partialLeft) {
      add(name, items, [
        { amount: Math.round(amount / 2 / 10_000) * 10_000, method, status: "berhasil", createdAt: on(6) },
      ])
    } else {
      /* Sebagian dibayar dua kali (cicil) */
      add(name, items, i % 4 === 0
        ? [
            { amount: amount / 2, method, status: "berhasil", createdAt: on(3) },
            { amount: amount / 2, method: "QRIS", status: "berhasil", createdAt: on(9) },
          ]
        : [{ amount, method, status: "berhasil", createdAt: on(1 + (i % 9)) }])
    }
  }
  bills.push(...created)
}

;(() => {
  const current = startOfMonth(new Date())
  buildMonth(current, { unpaid: 8, partial: 6 })
  buildMonth(subMonths(current, 1), { unpaid: 2, partial: 2 })
})()
