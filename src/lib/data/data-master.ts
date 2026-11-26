import type { Level, Lesson, Student, Tutor } from "@/types/data-master"

export const TUTOR_SUBJECTS = [
  "Matematika",
  "IPA",
  "Fisika",
  "Bahasa Inggris",
] as const
export const LEVELS: Level[] = ["SD", "SMP", "SMA"]
export const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const
export const DISTRICTS = [
  "Arosbaya",
  "Bangkalan",
  "Burneh",
  "Kamal",
  "Socah",
] as const
/* Radius layanan tutor dari domisilinya */
export const SERVICE_RADIUS_KM = 5

export const LEVEL_GRADES: Record<Level, string> = {
  SD: "kelas 1–6",
  SMP: "kelas 7–9",
  SMA: "kelas 10–12",
}

/* ---------- Tutor ---------- */

export const tutors: Tutor[] = [
  {
    id: "tt-budi",
    name: "Kak Budi Santoso",
    phone: "0857-1122-3344",
    email: "budi.santoso@gmail.com",
    education: "S1 Pendidikan Matematika, Univ. Trunojoyo",
    subjects: ["Matematika", "IPA"],
    levels: ["SMP"],
    days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    from: "15.00",
    until: "21.00",
    address: "Jl. Halim Perdana Kusuma No. 8, Bangkalan",
    district: "Bangkalan",
    rate: 60_000,
    pickup: "Tunai di LBB",
    joinedAt: new Date(2025, 2, 3),
    activeStudents: 3,
    activeSchedules: 3,
    status: "aktif",
  },
  {
    id: "tt-dimas",
    name: "Kak Dimas Arya",
    phone: "0812-4455-6677",
    email: "dimas.arya@gmail.com",
    education: "S1 Pendidikan Fisika, Univ. Trunojoyo",
    subjects: ["Fisika", "Matematika"],
    levels: ["SMA"],
    days: ["Senin", "Selasa", "Kamis"],
    from: "16.00",
    until: "21.00",
    address: "Jl. Soekarno Hatta No. 21, Bangkalan",
    district: "Bangkalan",
    rate: 60_000,
    pickup: "Transfer bank",
    joinedAt: new Date(2024, 7, 12),
    activeStudents: 4,
    activeSchedules: 5,
    status: "aktif",
  },
  {
    id: "tt-laila",
    name: "Kak Laila Fitri",
    phone: "0813-2233-9080",
    email: "laila.fitri@gmail.com",
    education: "S1 Matematika, Univ. Negeri Surabaya",
    subjects: ["Matematika"],
    levels: ["SMP", "SMA"],
    days: ["Kamis", "Sabtu"],
    from: "15.00",
    until: "21.00",
    address: "Perum Socah Permai Blok C-4, Socah",
    district: "Socah",
    rate: 60_000,
    pickup: "Transfer bank",
    joinedAt: new Date(2024, 0, 20),
    activeStudents: 6,
    activeSchedules: 6,
    status: "aktif",
  },
  {
    id: "tt-rina",
    name: "Kak Rina Oktaviani",
    phone: "0878-5566-1200",
    email: "rina.oktaviani@gmail.com",
    education: "S1 Sastra Inggris, Univ. Airlangga",
    subjects: ["Bahasa Inggris"],
    levels: ["SD", "SMP"],
    days: ["Selasa", "Jumat"],
    from: "14.00",
    until: "17.00",
    address: "Jl. Raya Kamal No. 45, Kamal",
    district: "Kamal",
    rate: 50_000,
    pickup: "Transfer bank",
    joinedAt: new Date(2025, 5, 1),
    activeStudents: 3,
    activeSchedules: 3,
    status: "aktif",
  },
  {
    id: "tt-yoga",
    name: "Kak Yoga Pratama",
    phone: "0821-7788-4400",
    email: "yoga.pratama@gmail.com",
    education: "S1 Fisika, ITS",
    subjects: ["Fisika"],
    levels: ["SMA"],
    days: ["Senin", "Rabu", "Kamis"],
    from: "18.00",
    until: "21.00",
    address: "Jl. Raya Burneh No. 3, Burneh",
    district: "Burneh",
    rate: null,
    pickup: "Transfer bank",
    joinedAt: new Date(2026, 9, 5),
    activeStudents: 2,
    activeSchedules: 2,
    status: "aktif",
  },
  {
    id: "tt-fitri",
    name: "Kak Fitri Handayani",
    phone: "0852-3344-1188",
    email: "fitri.handayani@gmail.com",
    education: "S1 Pendidikan Biologi, Univ. Trunojoyo",
    subjects: ["IPA"],
    levels: ["SD"],
    days: ["Senin", "Rabu"],
    from: "15.00",
    until: "18.00",
    address: "Desa Arosbaya RT 02/RW 01, Arosbaya",
    district: "Arosbaya",
    rate: 50_000,
    pickup: "Tunai di LBB",
    joinedAt: new Date(2023, 10, 2),
    activeStudents: 0,
    activeSchedules: 0,
    status: "nonaktif",
  },
]

/* Isi daftar sampai 70 tutor (64 aktif) agar sesuai ringkasan menu Lainnya */
;(() => {
  const first = ["Andi", "Bella", "Cahyo", "Dina", "Eko", "Farah", "Gilang", "Hana", "Irfan", "Jihan", "Kevin", "Lusi"]
  const last = ["Wibowo", "Kusuma", "Ramadhan", "Safitri", "Hakim", "Anggraini", "Firmansyah", "Utami"]
  for (let i = tutors.length; i < 70; i++) {
    const name = `Kak ${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`
    const subjects = [TUTOR_SUBJECTS[i % 4], ...(i % 3 === 0 ? [TUTOR_SUBJECTS[(i + 1) % 4]] : [])]
    const levels: Level[] = i % 2 === 0 ? ["SMP"] : ["SD", "SMP"]
    const district = DISTRICTS[i % DISTRICTS.length]
    const inactive = i >= 65
    tutors.push({
      id: `tt-${i}`,
      name,
      phone: `0812-${String(1000 + i * 37).slice(0, 4)}-${String(2000 + i * 53).slice(0, 4)}`,
      email: `${name.replace(/^Kak\s+/, "").toLowerCase().replace(/\s+/g, ".")}${i}@gmail.com`,
      education: "S1 Pendidikan, Univ. Trunojoyo",
      subjects,
      levels,
      days: ["Senin", "Rabu", "Jumat"],
      from: "15.00",
      until: "20.00",
      address: `Kec. ${district}`,
      district,
      rate: 50_000 + (i % 3) * 5_000,
      pickup: i % 2 ? "Transfer bank" : "Tunai di LBB",
      joinedAt: new Date(2024, i % 12, 1 + (i % 27)),
      activeStudents: inactive ? 0 : 1 + (i % 4),
      activeSchedules: inactive ? 0 : 1 + (i % 4),
      status: inactive ? "nonaktif" : "aktif",
    })
  }
})()

/* ---------- Siswa ---------- */

const lesson = (
  subject: string,
  day: string,
  tutorName: string,
  from = "16.00",
  until = "17.30"
): Lesson => ({ subject, day, from, until, tutorName })

export const students: Student[] = [
  {
    id: "sw-aisyah",
    name: "Aisyah Putri",
    grade: "8 SMP",
    school: "SMP Negeri 1 Bangkalan",
    address: "Jl. Trunojoyo No. 12, Bangkalan",
    district: "Bangkalan",
    subjects: ["Matematika", "IPA"],
    needs: "Persiapan ujian akhir semester",
    guardian: {
      name: "Sari Wulandari",
      phone: "0812-3456-7890",
      accountActive: true,
      linkedStudents: 1,
    },
    lessons: [
      lesson("Matematika", "Rabu", "Kak Budi Santoso"),
      lesson("IPA", "Jumat", "Kak Budi Santoso"),
    ],
    status: "aktif",
  },
  {
    id: "sw-rafi",
    name: "Rafi Hidayat",
    grade: "11 SMA",
    school: "SMA Negeri 2 Bangkalan",
    address: "Jl. Kartini No. 7, Bangkalan",
    district: "Bangkalan",
    subjects: ["Fisika", "Matematika"],
    needs: "Persiapan olimpiade fisika",
    guardian: {
      name: "Agus Setiawan",
      phone: "0813-9988-1122",
      accountActive: true,
      linkedStudents: 1,
    },
    lessons: [
      lesson("Fisika", "Senin", "Kak Dimas Arya", "19.00", "20.30"),
      lesson("Matematika", "Kamis", "Kak Dimas Arya", "19.00", "20.30"),
    ],
    status: "aktif",
  },
  {
    id: "sw-nadia",
    name: "Nadia Salsabila",
    grade: "5 SD",
    school: "SD Negeri Socah 1",
    address: "Perum Socah Indah B-2, Socah",
    district: "Socah",
    subjects: ["Matematika"],
    needs: "Penguatan konsep pecahan",
    guardian: {
      name: "Dewi Anggraini",
      phone: "0857-2211-3344",
      accountActive: true,
      linkedStudents: 2,
    },
    lessons: [lesson("Matematika", "Selasa", "Kak Dimas Arya")],
    status: "aktif",
  },
  {
    id: "sw-salma",
    name: "Salma Azzahra",
    grade: "7 SMP",
    school: "SMP Negeri 1 Kamal",
    address: "Jl. Raya Kamal No. 88, Kamal",
    district: "Kamal",
    subjects: ["Bahasa Inggris"],
    needs: "Percakapan sehari-hari",
    guardian: {
      name: "Rina Marlina",
      phone: "0878-1100-2299",
      accountActive: true,
      linkedStudents: 1,
    },
    lessons: [],
    status: "aktif",
  },
  {
    id: "sw-dimas",
    name: "Dimas Pratama",
    grade: "9 SMP",
    school: "SMP Negeri 3 Bangkalan",
    address: "Jl. Letnan Abdullah No. 5, Bangkalan",
    district: "Bangkalan",
    subjects: ["IPA"],
    needs: "Persiapan ujian sekolah",
    guardian: {
      name: "Teguh Prasetyo",
      phone: "0821-5544-6677",
      accountActive: false,
      linkedStudents: 1,
    },
    lessons: [lesson("IPA", "Kamis", "Kak Budi Santoso")],
    status: "aktif",
  },
  {
    id: "sw-bayu",
    name: "Bayu Saputra",
    grade: "6 SD",
    school: "SD Negeri Burneh 2",
    address: "Desa Burneh RT 01/RW 03, Burneh",
    district: "Burneh",
    subjects: ["Matematika"],
    needs: "Persiapan masuk SMP",
    guardian: {
      name: "Hendra Saputra",
      phone: "0852-7788-9900",
      accountActive: true,
      linkedStudents: 1,
    },
    lessons: [],
    status: "nonaktif",
    endedAt: new Date(2026, 9, 1),
  },
]

/* Isi daftar sampai 100 siswa (92 aktif) agar sesuai ringkasan menu Lainnya */
;(() => {
  const first = ["Alya", "Bima", "Citra", "Fajar", "Galih", "Intan", "Kirana", "Raka", "Tiara", "Yusuf", "Zahra", "Hafiz"]
  const last = ["Maharani", "Wijaya", "Lestari", "Nugroho", "Rahmawati", "Permata", "Hidayat", "Pratama"]
  const tutorNames = ["Kak Budi Santoso", "Kak Dimas Arya", "Kak Laila Fitri", "Kak Rina Oktaviani"]
  const grades = ["4 SD", "6 SD", "7 SMP", "8 SMP", "9 SMP", "10 SMA", "12 SMA"]
  for (let i = students.length; i < 100; i++) {
    const district = DISTRICTS[i % DISTRICTS.length]
    const subject = TUTOR_SUBJECTS[i % 4]
    const inactive = i >= 94
    students.push({
      id: `sw-${i}`,
      name: `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`,
      grade: grades[i % grades.length],
      school: `Sekolah Negeri ${district}`,
      address: `Kec. ${district}`,
      district,
      subjects: [subject],
      needs: "Pendampingan belajar rutin",
      guardian: {
        name: `Wali ${last[i % last.length]}`,
        phone: `0812-${String(3000 + i * 41).slice(0, 4)}-${String(5000 + i * 17).slice(0, 4)}`,
        accountActive: true,
        linkedStudents: 1,
      },
      lessons: inactive
        ? []
        : [lesson(subject, DAYS[i % DAYS.length], tutorNames[i % tutorNames.length])],
      status: inactive ? "nonaktif" : "aktif",
      endedAt: inactive ? new Date(2026, 8 + (i % 2), 1) : undefined,
    })
  }
})()

/* Mata pelajaran untuk filter daftar siswa (gabungan semua mapel) */
export const STUDENT_SUBJECTS = TUTOR_SUBJECTS

/* ---------- Direktori untuk Manajemen Akun (P10) ---------- */

/* Akun tutor mengikuti Data Tutor: satu tutor = satu akun login */
export function tutorDirectory() {
  return tutors.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    joinedAt: t.joinedAt,
    status: t.status,
  }))
}

/* Siswa yang bisa ditautkan ke akun wali */
export function studentDirectory() {
  return students.map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    status: s.status,
  }))
}

/* Pasangan les rutin (siswa × tutor × mapel) untuk Rekap & Riwayat Les (P11) */
export function lessonDirectory() {
  return students.flatMap((s) =>
    s.lessons.map((l) => ({
      studentId: s.id,
      studentName: s.name,
      grade: s.grade,
      ...l,
      tutorId: tutors.find((t) => t.name === l.tutorName)?.id ?? l.tutorName,
    }))
  )
}
