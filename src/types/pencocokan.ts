import type { Level } from "@/types/data-master"
import type { PengelolaRegistration } from "@/types/verifikasi"

export type MatchingTutor = {
  id: string
  name: string
  /* Nama sapaan untuk tombol, mis. "Kak Dimas" */
  shortName: string
  initials: string
  education: string
  subjects: string[]
  levels: Level[]
  /* Hari mengajar dan rentang jam "HH.mm" */
  days: string[]
  from: string
  until: string
  rating: number
  activeStudents: number
  /* Tarif tutor per sesi (Rupiah) */
  rate: number
  /*
   * Slot yang baru saja terisi siswa lain, mis. "Senin 19.00". Belum
   * tercermin di kriteria ketersediaan (data jadwal tersinkron berkala),
   * jadi baru ketahuan saat penawaran akan dikirim (P4 · Error).
   */
  takenSlots?: string[]
  /* Jarak ke alamat les per pendaftaran (dari layanan peta di backend) */
  distanceKm: Record<string, number>
  defaultDistanceKm: number
}

export type Criterion = { label: string; met: boolean }

export type Candidate = {
  tutorId: string
  name: string
  shortName: string
  initials: string
  education: string
  rating: number
  activeStudents: number
  criteria: Criterion[]
  /* 0–100 */
  score: number
  /* Semua kriteria terpenuhi */
  fullMatch: boolean
}

export type MatchingCandidates = {
  registration: PengelolaRegistration
  /* Tutor yang mengajar minimal satu mapel di jenjang ini, skor tertinggi dulu */
  candidates: Candidate[]
  fullMatches: number
}

export type OfferTutorInfo = {
  id: string
  name: string
  shortName: string
  rate: number
  distanceKm: number
  /* Slot jadwal diminta yang sudah terisi siswa lain, mis. "Senin 19.00" */
  takenSlot: string | null
}
