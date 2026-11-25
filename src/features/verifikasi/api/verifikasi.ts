import { queryOptions } from "@tanstack/react-query"

import { assertMockAllowed, at, delay } from "@/features/dashboard/api/mock"

/*
 * Verifikasi Pendaftaran (pengelola) · Figma PINTARA → UI Screen →
 * Pengelola LBB → P2 · Verifikasi Pendaftaran
 *
 * TODO(backend):
 *   getRegistrations()       → httpClient.get("/pengelola/pendaftaran")
 *   getRegistration(id)      → httpClient.get(`/pengelola/pendaftaran/${id}`)
 *   verifyRegistration(id)   → httpClient.post(`/pengelola/pendaftaran/${id}/verifikasi`)
 *   rejectRegistration(id,…) → httpClient.post(`/pengelola/pendaftaran/${id}/tolak`, input)
 *
 * Selama backend belum ada (mode development) data disimpan di memori:
 * hasil verifikasi/penolakan langsung memindahkan pendaftaran ke tab lain.
 */
export type RegistrationStatus =
  "menunggu_verifikasi" | "terverifikasi" | "ditolak"

export type Level = "SD" | "SMP" | "SMA"

export type RejectReason =
  "di_luar_jangkauan" | "tutor_belum_tersedia" | "data_tidak_valid" | "lainnya"

export const REJECT_REASONS: { value: RejectReason; label: string }[] = [
  { value: "di_luar_jangkauan", label: "Alamat di luar jangkauan layanan" },
  {
    value: "tutor_belum_tersedia",
    label: "Tutor untuk jenjang/mapel belum tersedia",
  },
  { value: "data_tidak_valid", label: "Data pendaftaran tidak valid" },
  { value: "lainnya", label: "Lainnya" },
]

export type PengelolaRegistration = {
  id: string
  number: string
  student: {
    name: string
    /* Mis. "11" */
    grade: string
    level: Level
    school: string
    address: string
  }
  parent: {
    name: string
    /* "Bapak" / "Ibu", dipakai di pesan untuk wali */
    salutation: string
    whatsapp: string
    email: string
  }
  needs: {
    subjects: string[]
    perWeek: number
    days: string[]
    /* "HH.mm" */
    startTime: string
    notes?: string
  }
  submittedAt: Date
  status: RegistrationStatus
  verifiedAt?: Date
  rejection?: { reason: RejectReason; message: string; at: Date }
}

/* "Kelas 11 SMA" */
export const gradeLabel = (s: PengelolaRegistration["student"]) =>
  `Kelas ${s.grade} ${s.level}`

/* ---------- Data contoh ---------- */

const registrations: PengelolaRegistration[] = [
  {
    id: "reg-0115",
    number: "REG-2026-0115",
    student: {
      name: "Rafi Hidayat",
      grade: "11",
      level: "SMA",
      school: "SMA Negeri 2 Bangkalan",
      address: "Perum Griya Utama Blok C-7, Bangkalan",
    },
    parent: {
      name: "Hendra Wijaya",
      salutation: "Bapak",
      whatsapp: "0813-2233-4455",
      email: "hendra.wijaya@gmail.com",
    },
    needs: {
      subjects: ["Fisika", "Matematika"],
      perWeek: 2,
      days: ["Senin", "Kamis"],
      startTime: "19.00",
      notes: "Persiapan UTBK 2027",
    },
    submittedAt: at(-2, 19, 40),
    status: "menunggu_verifikasi",
  },
  {
    id: "reg-0118",
    number: "REG-2026-0118",
    student: {
      name: "Nadia Salsabila",
      grade: "5",
      level: "SD",
      school: "SD Negeri Kemayoran 1",
      address: "Jl. Halim Perdana Kusuma No. 8, Bangkalan",
    },
    parent: {
      name: "Rina Kartika",
      salutation: "Ibu",
      whatsapp: "0812-7788-9900",
      email: "rina.kartika@gmail.com",
    },
    needs: {
      subjects: ["Matematika"],
      perWeek: 1,
      days: ["Rabu"],
      startTime: "15.30",
    },
    submittedAt: at(-1, 10, 15),
    status: "menunggu_verifikasi",
  },
  {
    id: "reg-0121",
    number: "REG-2026-0121",
    student: {
      name: "Fajar Ramadhan",
      grade: "9",
      level: "SMP",
      school: "SMP Negeri 1 Bangkalan",
      address: "Jl. KH. Moh. Kholil No. 21, Bangkalan",
    },
    parent: {
      name: "Andi Saputra",
      salutation: "Bapak",
      whatsapp: "0857-3344-5566",
      email: "andi.saputra@gmail.com",
    },
    needs: {
      subjects: ["IPA", "Bahasa Inggris"],
      perWeek: 2,
      days: ["Selasa", "Jumat"],
      startTime: "16.00",
      notes: "Persiapan ujian sekolah",
    },
    submittedAt: at(0, 7, 5),
    status: "menunggu_verifikasi",
  },
  {
    id: "reg-0109",
    number: "REG-2026-0109",
    student: {
      name: "Dimas Pratama",
      grade: "9",
      level: "SMP",
      school: "SMP Negeri 2 Bangkalan",
      address: "Perum Kraton Indah B-3, Bangkalan",
    },
    parent: {
      name: "Arif Pratama",
      salutation: "Bapak",
      whatsapp: "0857-1122-3344",
      email: "arif.pratama@gmail.com",
    },
    needs: {
      subjects: ["IPA", "Matematika"],
      perWeek: 2,
      days: ["Senin", "Kamis"],
      startTime: "16.00",
    },
    submittedAt: at(-24, 20, 10),
    status: "terverifikasi",
    verifiedAt: at(-23, 9, 30),
  },
  {
    id: "reg-0112",
    number: "REG-2026-0112",
    student: {
      name: "Salsa Amelia",
      grade: "4",
      level: "SD",
      school: "SD Negeri Bancaran 2",
      address: "Jl. Raya Tanjung Bumi No. 3, Bangkalan",
    },
    parent: {
      name: "Wahyu Hidayat",
      salutation: "Bapak",
      whatsapp: "0821-4455-6677",
      email: "wahyu.hidayat@gmail.com",
    },
    needs: {
      subjects: ["Matematika", "Bahasa Indonesia"],
      perWeek: 2,
      days: ["Selasa", "Kamis"],
      startTime: "15.00",
    },
    submittedAt: at(-6, 18, 45),
    status: "terverifikasi",
    verifiedAt: at(-5, 8, 20),
  },
  {
    id: "reg-0107",
    number: "REG-2026-0107",
    student: {
      name: "Kevin Pratama",
      grade: "12",
      level: "SMA",
      school: "SMA Negeri 1 Sampang",
      address: "Jl. Jaksa Agung Suprapto No. 40, Sampang",
    },
    parent: {
      name: "Yuni Lestari",
      salutation: "Ibu",
      whatsapp: "0813-9988-7766",
      email: "yuni.lestari@gmail.com",
    },
    needs: {
      subjects: ["Kimia"],
      perWeek: 1,
      days: ["Sabtu"],
      startTime: "09.00",
    },
    submittedAt: at(-12, 13, 0),
    status: "ditolak",
    rejection: {
      reason: "di_luar_jangkauan",
      message:
        "Mohon maaf, alamat les di Sampang belum termasuk area layanan kami. Kami akan mengabari Ibu bila layanan sudah menjangkau area tersebut.",
      at: at(-11, 10, 5),
    },
  },
]

/* ---------- Daftar ---------- */

export type RegistrationList = {
  counts: Record<RegistrationStatus, number>
  items: PengelolaRegistration[]
}

export async function getRegistrations(filter: {
  status: RegistrationStatus
  query?: string
  level?: Level
}): Promise<RegistrationList> {
  assertMockAllowed()
  await delay()

  const q = filter.query?.trim().toLowerCase() ?? ""
  const matches = (r: PengelolaRegistration) =>
    (!q ||
      r.student.name.toLowerCase().includes(q) ||
      r.parent.name.toLowerCase().includes(q)) &&
    (!filter.level || r.student.level === filter.level)

  const counts = { menunggu_verifikasi: 0, terverifikasi: 0, ditolak: 0 }
  registrations.forEach((r) => counts[r.status]++)

  /* Menunggu: paling lama menunggu dulu; tab lain: keputusan terbaru dulu */
  const decidedAt = (r: PengelolaRegistration) =>
    (r.verifiedAt ?? r.rejection?.at ?? r.submittedAt).getTime()
  const items = registrations
    .filter((r) => r.status === filter.status && matches(r))
    .sort((a, b) =>
      filter.status === "menunggu_verifikasi"
        ? a.submittedAt.getTime() - b.submittedAt.getTime()
        : decidedAt(b) - decidedAt(a)
    )

  return { counts, items: structuredClone(items) }
}

export const registrationsQuery = (filter: {
  status: RegistrationStatus
  query?: string
  level?: Level
}) =>
  queryOptions({
    queryKey: [
      "verifikasi",
      "daftar",
      filter.status,
      filter.query ?? "",
      filter.level ?? "semua",
    ],
    queryFn: () => getRegistrations(filter),
  })

/* ---------- Detail ---------- */

export class NotFoundError extends Error {
  constructor() {
    super("Pendaftaran tidak ditemukan.")
    this.name = "NotFoundError"
  }
}

/* Pendaftaran sudah diverifikasi/ditolak (mis. oleh pengelola lain) */
export class AlreadyProcessedError extends Error {
  constructor() {
    super("Pendaftaran sudah diproses.")
    this.name = "AlreadyProcessedError"
  }
}

function find(id: string) {
  const registration = registrations.find((r) => r.id === id)
  if (!registration) throw new NotFoundError()
  return registration
}

export async function getRegistration(
  id: string
): Promise<PengelolaRegistration> {
  assertMockAllowed()
  await delay(300)
  return structuredClone(find(id))
}

export const registrationQuery = (id: string) =>
  queryOptions({
    queryKey: ["verifikasi", "detail", id],
    queryFn: () => getRegistration(id),
  })

/* ---------- Aksi ---------- */

function findPending(id: string) {
  if (!navigator.onLine) throw new Error("Tidak ada koneksi internet.")
  const registration = find(id)
  if (registration.status !== "menunggu_verifikasi")
    throw new AlreadyProcessedError()
  return registration
}

/* Verifikasi: data siswa dibuat dan wali menerima notifikasi */
export async function verifyRegistration(
  id: string
): Promise<PengelolaRegistration> {
  assertMockAllowed()
  await delay(800)
  const registration = findPending(id)
  registration.status = "terverifikasi"
  registration.verifiedAt = new Date()
  return structuredClone(registration)
}

export type RejectInput = { reason: RejectReason; message: string }

export async function rejectRegistration(
  id: string,
  input: RejectInput
): Promise<PengelolaRegistration> {
  assertMockAllowed()
  await delay(800)
  const registration = findPending(id)
  registration.status = "ditolak"
  registration.rejection = {
    reason: input.reason,
    message: input.message.trim(),
    at: new Date(),
  }
  return structuredClone(registration)
}
