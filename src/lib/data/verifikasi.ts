import type { RejectReason } from "@/types/verifikasi"

export const REJECT_REASONS: { value: RejectReason; label: string }[] = [
  { value: "di_luar_jangkauan", label: "Alamat di luar jangkauan layanan" },
  {
    value: "tutor_belum_tersedia",
    label: "Tutor untuk jenjang/mapel belum tersedia",
  },
  { value: "data_tidak_valid", label: "Data pendaftaran tidak valid" },
  { value: "lainnya", label: "Lainnya" },
]
