/* Format tampilan Penawaran Tutor (P4) */

/* 2.1 → "2,1 km" */
export const formatKm = (km: number) =>
  `${km.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`
