import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format, getDay } from "date-fns"
import { useNavigate, useParams } from "react-router"

import { Button, DataState, DetailScreen, ResultScreen } from "@/components"
import {
  isNotFoundError,
  submitTutorScheduleChange,
  tutorScheduleSessionQuery,
} from "@/features/jadwal/api"
import { ChangeSummaryCard } from "@/features/jadwal/components"
import { getErrorMessage } from "@/lib/api"
import type { ChangeRequest, TutorScheduleDetail } from "@/types/jadwal"

import { ChangeForm, type ChangeFormRoutine } from "./ajukan-perubahan"

/*
 * T5 · Ajukan Perubahan Jadwal (tutor) · POST /tutor/pengajuan-jadwal.
 *
 * Dibuka dari Detail Jadwal tutor. Memakai formulir yang sama dengan wali
 * (W4): berlaku untuk · jadwal alternatif · alasan. Pengajuan masuk ke
 * Pengelola LBB, yang mengonfirmasinya dengan wali.
 */
const JADWAL = "/tutor/jadwal"

/* Sesi → jadwal rutin yang diubah (hari & jam dari sesi ini) */
function toRoutine(
  session: TutorScheduleDetail & { routineId: string }
): ChangeFormRoutine {
  return {
    id: session.routineId,
    subject: session.subject,
    weekday: getDay(session.start),
    startTime: format(session.start, "HH.mm"),
    durationMinutes: Math.round(
      (session.end.getTime() - session.start.getTime()) / 60_000
    ),
    nextSession: session.start,
  }
}

function AjukanPerubahanTutor() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(tutorScheduleSessionQuery(sessionId))
  const [sent, setSent] = React.useState<ChangeRequest | null>(null)
  const session = query.data

  if (sent) {
    return (
      <ResultScreen
        title="Pengajuan terkirim"
        description={`Pengelola LBB akan mengonfirmasi dengan wali ${session?.student.name ?? "siswa"} dan mengabari Anda.`}
        align="top"
        footerVariant="bar"
        pageTitle="Ajukan Perubahan"
        pageBack={{
          label: "Jadwal",
          onClick: () => navigate(JADWAL, { replace: true }),
        }}
        pageWidth="default"
        footer={
          <Button onClick={() => navigate(JADWAL, { replace: true })}>
            Kembali ke Jadwal
          </Button>
        }
      >
        <ChangeSummaryCard request={sent} />
      </ResultScreen>
    )
  }

  if (session?.routineId) {
    return (
      <ChangeForm
        routine={toRoutine({ ...session, routineId: session.routineId })}
        onSent={setSent}
        audience="tutor"
        submitChange={submitTutorScheduleChange}
      />
    )
  }

  return (
    <DetailScreen
      title="Ajukan Perubahan"
      desktopHeader="page"
      backLabel="Detail Jadwal"
      desktopWidth="wide"
    >
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Memuat jadwal…" />
      ) : query.isError && !isNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Jadwal gagal dimuat"
          description={getErrorMessage(query.error)}
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Jadwal tidak ditemukan"
              : "Perubahan belum bisa diajukan"
          }
          description={
            query.isError
              ? "Sesi ini mungkin sudah dipindahkan atau dibatalkan."
              : "Perubahan hanya bisa diajukan untuk sesi dalam 4 minggu ke depan."
          }
          action={{
            label: "Kembali ke Jadwal",
            onClick: () => navigate(JADWAL, { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

export { AjukanPerubahanTutor }
