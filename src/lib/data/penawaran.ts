import type { DeclineReason } from "@/types/penawaran"

export const DECLINE_REASONS: { value: DeclineReason; label: string }[] = [
  { value: "jadwal_bentrok", label: "Jadwal bentrok" },
  { value: "lokasi_jauh", label: "Lokasi terlalu jauh" },
  { value: "tidak_menguasai", label: "Tidak menguasai materi atau jenjang" },
  { value: "lainnya", label: "Lainnya" },
]
