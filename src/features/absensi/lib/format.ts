import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

/* "Rab, 19 Nov 2026" — judul Detail Sesi, Ajukan Keberatan, Beri Ulasan */
export const formatSessionDate = (date: Date) =>
  format(date, "EEE, d MMM yyyy", { locale: localeId })

/* "Matematika · Rab, 19 Nov 2026" */
export const formatSessionTitle = (subject: string, start: Date) =>
  `${subject} · ${formatSessionDate(start)}`

/* Label nilai rating 1–5 (Figma: 4 = "Baik") */
export const RATING_LABELS = [
  "Sangat kurang",
  "Kurang",
  "Cukup",
  "Baik",
  "Sangat baik",
]
