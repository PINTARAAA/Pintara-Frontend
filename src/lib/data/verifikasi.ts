import { at } from "@/lib/data/mock"
import type { PengelolaRegistration, RejectReason } from "@/types/verifikasi"

export const REJECT_REASONS: { value: RejectReason; label: string }[] = [
  { value: "di_luar_jangkauan", label: "Alamat di luar jangkauan layanan" },
  {
    value: "tutor_belum_tersedia",
    label: "Tutor untuk jenjang/mapel belum tersedia",
  },
  { value: "data_tidak_valid", label: "Data pendaftaran tidak valid" },
  { value: "lainnya", label: "Lainnya" },
]

/* ---------- Data contoh ---------- */

export const registrations: PengelolaRegistration[] = [
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
    match: {
      tutorId: "tt-budi",
      tutorName: "Kak Budi Santoso",
      at: at(-22, 14, 0),
    },
  },
  {
    id: "reg-0112",
    number: "REG-2026-0112",
    student: {
      name: "Salma Azzahra",
      grade: "7",
      level: "SMP",
      school: "SMP Negeri 3 Bangkalan",
      address: "Jl. Raya Tanjung Bumi No. 3, Bangkalan",
    },
    parent: {
      name: "Wahyu Hidayat",
      salutation: "Bapak",
      whatsapp: "0821-4455-6677",
      email: "wahyu.hidayat@gmail.com",
    },
    needs: {
      subjects: ["Bahasa Inggris"],
      perWeek: 2,
      days: ["Selasa", "Jumat"],
      startTime: "15.00",
    },
    submittedAt: at(-4, 18, 45),
    status: "terverifikasi",
    verifiedAt: at(-3, 8, 20),
    /* Kak Nadia menolak penawaran (lihat riwayat penawaran P4) */
    declinedTutorIds: ["tt-nadia"],
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
