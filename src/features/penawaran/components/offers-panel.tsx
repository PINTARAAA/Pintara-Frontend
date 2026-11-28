import type { UseQueryResult } from "@tanstack/react-query"
import { formatDistanceToNowStrict } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { SendIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router"

import { StatusBadge, DataState, ListItem } from "@/components"
import {
  DashboardList,
  DashboardSection,
} from "@/features/dashboard/components"
import { declineLabel } from "@/features/penawaran/api"
import type { Offer, OfferList } from "@/types/penawaran"
import { getErrorMessage } from "@/lib/api"
import { firstName, formatDayMonth } from "@/lib/format"

/*
 * P4 · Penawaran (tab Les) · Figma "Penawaran / Daftar"
 *
 * [Belum dikirim: tutor sudah dipilih di P3, penawaran belum dikirim] →
 * Menunggu konfirmasi tutor (ketuk → detail, catat jawaban) → Riwayat
 * penawaran (badge Diterima/Ditolak + alasan).
 *
 * Desktop (Figma "Penawaran / Daftar (Desktop)"): dua kolom, kiri (Belum
 * dikirim · Menunggu konfirmasi) mengisi sisa lebar, kanan Riwayat 420px,
 * jarak 40.
 */
const LES = "/pengelola/les"

/* Singkatan mapel di riwayat yang padat: "Bahasa Inggris" → "B. Inggris" */
const shortSubject = (s: string) => s.replace(/^Bahasa /, "B. ")

/* "2 jam lalu" · "kemarin" */
const ago = (date: Date) =>
  `${formatDistanceToNowStrict(date, { locale: localeId })} lalu`

function OffersPanel({ query }: { query: UseQueryResult<OfferList> }) {
  if (query.isPending) {
    return <DataState state="loading" loadingLabel="Memuat penawaran…" />
  }
  if (query.isError) {
    return (
      <DataState
        state="error"
        title="Penawaran gagal dimuat"
        description={getErrorMessage(query.error)}
        action={{ label: "Coba lagi", onClick: () => query.refetch() }}
      />
    )
  }

  const { unsent, waiting, history } = query.data
  if (unsent.length + waiting.length + history.length === 0) {
    return (
      <DataState
        state="empty"
        icon={<SendIcon />}
        title="Belum ada penawaran"
        description="Penawaran ke tutor akan muncul di sini setelah Anda mencocokkan siswa."
      />
    )
  }

  return (
    <div className="gap-ns-2xl lg:gap-ns-4xl grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div className="gap-ns-2xl flex flex-col">
        {unsent.length > 0 && (
          <DashboardSection
            title="Belum dikirim"
            description="Tutor sudah dipilih, kirim penawarannya"
          >
            <DashboardList>
              {unsent.map(({ registration: r, tutorName }) => (
                <ListItem
                  key={r.id}
                  icon={<SendIcon />}
                  title={`${r.student.name} × ${tutorName}`}
                  description={`${r.needs.subjects.join(", ")} · belum dikirim`}
                  chevron
                  render={<Link to={`${LES}/penawaran/${r.id}/buat`} />}
                />
              ))}
            </DashboardList>
          </DashboardSection>
        )}

        <DashboardSection title="Menunggu konfirmasi tutor">
          {waiting.length > 0 ? (
            <DashboardList>
              {waiting.map((o) => (
                <ListItem
                  key={o.id}
                  icon={<UsersIcon />}
                  title={`${o.student.name} × ${o.tutor.name}`}
                  description={`${o.subjects.join(", ")} · dikirim ${ago(o.sentAt)}`}
                  chevron
                  render={<Link to={`${LES}/penawaran/${o.id}`} />}
                />
              ))}
            </DashboardList>
          ) : (
            <p className="text-caption text-grayscale-text-caption leading-normal">
              Tidak ada penawaran yang menunggu jawaban tutor.
            </p>
          )}
        </DashboardSection>
      </div>

      {history.length > 0 && (
        <DashboardSection title="Riwayat penawaran">
          <DashboardList>
            {history.map((o) => (
              <HistoryItem key={o.id} offer={o} />
            ))}
          </DashboardList>
        </DashboardSection>
      )}
    </div>
  )
}

function HistoryItem({ offer: o }: { offer: Offer }) {
  const parts = [
    o.subjects.map(shortSubject).join(", "),
    formatDayMonth(o.answeredAt ?? o.sentAt),
    o.decline && declineLabel(o.decline.reason).toLowerCase(),
  ].filter(Boolean)

  return (
    <ListItem
      title={`${firstName(o.student.name)} × ${o.tutor.name}`}
      description={parts.join(" · ")}
      badge={
        o.status !== "menunggu_konfirmasi" && (
          <StatusBadge category="penawaran_tutor" status={o.status} />
        )
      }
      render={<Link to={`${LES}/penawaran/${o.id}`} />}
    />
  )
}

export { OffersPanel }
