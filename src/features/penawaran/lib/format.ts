/* Format tampilan Penawaran Tutor (P4) */

/* "Rafi Hidayat" → "Rafi" */
export const firstName = (name: string) => name.trim().split(/\s+/)[0]

/* 2.1 → "2,1 km" */
export const formatKm = (km: number) =>
  `${km.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`
