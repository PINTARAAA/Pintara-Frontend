import { PaperclipIcon, StarIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components"
import type { AttendanceSession } from "@/types/absensi"
import { RATING_LABELS } from "@/features/absensi/lib"
import { formatDateTime } from "@/lib/format/date"

/*
 * Kartu bersama Detail Sesi (W5) dan Riwayat Les / Detail sesi (W7):
 * catatan tutor + lampiran, dan ulasan wali (bintang 20px + komentar).
 */
function NotesCard({
  session,
  title = "Catatan & Dokumentasi",
}: {
  session: AttendanceSession
  title?: string
}) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{session.notes || "Tutor tidak menambahkan catatan."}</p>
        {session.attachments.length > 0 && (
          <ul className="flex flex-col gap-ns-m" aria-label="Lampiran">
            {session.attachments.map((file) => (
              <li
                key={file}
                className="flex items-center gap-ns-s rounded-md bg-grayscale-surface-subtitle px-ns-m py-ns-s text-caption text-grayscale-text-body"
              >
                <PaperclipIcon aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{file}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/* Ulasan yang sudah dikirim wali */
function ReviewCard({
  review,
}: {
  review: NonNullable<AttendanceSession["review"]>
}) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardTitle>Ulasan Anda</CardTitle>
        <CardDescription>Dikirim {formatDateTime(review.submittedAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-ns-s">
          <span
            className="flex gap-ns-2xs"
            role="img"
            aria-label={`${review.rating} dari 5 bintang, ${RATING_LABELS[review.rating - 1]}`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon
                key={i}
                aria-hidden="true"
                strokeWidth={2}
                className={
                  i < review.rating
                    ? "size-5 fill-warning text-warning"
                    : "size-5 text-grayscale-text-body"
                }
              />
            ))}
          </span>
        </div>
        {review.comment && <p>{review.comment}</p>}
      </CardContent>
    </Card>
  )
}

export { NotesCard, ReviewCard }
