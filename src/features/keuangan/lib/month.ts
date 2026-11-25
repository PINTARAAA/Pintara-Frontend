/* "2026-11" → 1 Nov 2026; nilai tidak valid → undefined (bulan berjalan) */
export function parseMonth(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return undefined
  const [y, m] = value.split("-").map(Number)
  return new Date(y, m - 1, 1)
}
