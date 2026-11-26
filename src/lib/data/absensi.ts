import {
  previousFriday,
  previousThursday,
  previousWednesday,
  setHours,
  setMinutes,
  startOfDay,
  subWeeks,
} from "date-fns"

import type { AttendanceSession } from "@/types/absensi"

/* ---------- Data contoh ---------- */

function slot(day: Date, hour: number, minutes = 90) {
  const start = setMinutes(setHours(startOfDay(day), hour), 0)
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const today = new Date()
const lastWed = previousWednesday(today)
const lastFri = previousFriday(today)
const lastThu = previousThursday(today)

const BUDI = { name: "Kak Budi Santoso", initials: "BS" }
const NADIA = { name: "Kak Nadia Safitri", initials: "NS" }
const aisyah = { studentId: "s1", studentName: "Aisyah Putri" }
const fikri = { studentId: "s2", studentName: "Fikri Ramadhan" }

export const sessions: AttendanceSession[] = [
  {
    id: "ses-ipa-1",
    ...aisyah,
    subject: "IPA",
    ...slot(lastFri, 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Sistem pencernaan manusia",
    notes:
      "Aisyah aktif bertanya dan mampu menjelaskan urutan organ pencernaan. Perlu mengulang fungsi enzim.",
    attachments: ["foto_sesi_ipa_1.jpg"],
    status: "belum_divalidasi",
  },
  {
    id: "ses-mtk-1",
    ...aisyah,
    subject: "Matematika",
    ...slot(lastWed, 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Persamaan linear satu variabel",
    notes:
      "Aisyah sudah memahami konsep dasar dan mampu menyelesaikan 8 dari 10 soal latihan. Perlu latihan tambahan pada soal cerita.",
    attachments: ["foto_sesi_mtk_1.jpg", "foto_sesi_mtk_2.jpg"],
    status: "belum_divalidasi",
  },
  {
    id: "ses-ipa-0",
    ...aisyah,
    subject: "IPA",
    ...slot(subWeeks(lastFri, 1), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Sistem peredaran darah",
    notes: "Materi tuntas. Aisyah mengerjakan 10 soal dengan 9 benar.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastFri, 1),
    review: {
      rating: 5,
      comment: "Penjelasan Kak Budi mudah dipahami.",
      submittedAt: setMinutes(setHours(startOfDay(subWeeks(lastFri, 1)), 19), 2),
    },
  },
  {
    id: "ses-mtk-0",
    ...aisyah,
    subject: "Matematika",
    ...slot(subWeeks(lastWed, 1), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Bentuk aljabar",
    notes: "Aisyah perlu latihan tambahan pada operasi pecahan aljabar.",
    attachments: ["foto_sesi_mtk_0.jpg"],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastWed, 1),
  },
  {
    id: "ses-ipa-x",
    ...aisyah,
    subject: "IPA",
    ...slot(subWeeks(lastFri, 2), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Sakit",
    topic: "Sistem gerak manusia",
    notes: "",
    attachments: [],
    status: "sudah_divalidasi",
    cancelReason: "siswa sakit",
  },
  {
    id: "ses-mtk-x",
    ...aisyah,
    subject: "Matematika",
    ...slot(subWeeks(lastWed, 2), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Bilangan berpangkat",
    notes: "Aisyah lancar menyelesaikan operasi bilangan berpangkat positif.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastWed, 2),
  },
  {
    id: "ses-ipa-y",
    ...aisyah,
    subject: "IPA",
    ...slot(subWeeks(lastFri, 3), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Klasifikasi makhluk hidup",
    notes: "Materi tuntas.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastFri, 3),
  },
  {
    id: "ses-mtk-y",
    ...aisyah,
    subject: "Matematika",
    ...slot(subWeeks(lastWed, 3), 16),
    tutor: BUDI,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Pola bilangan",
    notes: "Aisyah perlu latihan soal pola bilangan bertingkat.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: subWeeks(lastWed, 3),
  },
  {
    id: "ses-bing-0",
    ...fikri,
    subject: "Bahasa Inggris",
    ...slot(lastThu, 15),
    tutor: NADIA,
    tutorAttendance: "Hadir",
    studentAttendance: "Hadir",
    topic: "Simple present tense",
    notes: "Fikri sudah bisa membuat kalimat positif dan negatif.",
    attachments: [],
    status: "sudah_divalidasi",
    validatedAt: lastThu,
  },
]
