import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleXIcon, PhoneIcon, UsersIcon } from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"

import {
  DetailScreen,
  ResultScreen,
  RESULT_BUTTON_DESKTOP,
  AlertBanner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataState,
  ListItem,
  RadioGroup,
  toast,
  TutorCandidate,
} from "@/components"
import { DashboardList } from "@/features/dashboard/components"
import { SummaryRow } from "@/features/pendaftaran/components"
import {
  joinAnd,
  matchingCandidatesQuery,
  MAX_DISTANCE_KM,
  selectTutor,
} from "@/features/pencocokan/api"
import type { Candidate, MatchingCandidates } from "@/types/pencocokan"
import {
  gradeLabel,
  isAlreadyProcessedError,
  isNotFoundError,
  needsTutor,
} from "@/features/verifikasi/api"
import type { PengelolaRegistration } from "@/types/verifikasi"
import {
  formatRequestedSchedule,
  formatShortAddress,
} from "@/features/verifikasi/lib"
import { getErrorMessage } from "@/lib/api"
import { firstName, toWhatsAppUrl } from "@/lib/format"

/*
 * P3 · Cocokkan Tutor · Figma "Pencocokan / Kandidat tutor",
 * "/ Tidak ada kandidat" dan "/ Tersimpan".
 *
 * Kebutuhan siswa → kandidat tutor (Tutor candidate, dipilih seperti radio;
 * kandidat terbaik terpilih otomatis) → bilah aksi "Pilih Kak …".
 * Bila tidak ada tutor yang memenuhi semua kriteria: banner peringatan dan
 * alternatif (kecocokan sebagian · hubungi wali · tolak pendaftaran).
 * Setelah dipilih tampil layar hasil dengan ringkasan pencocokan.
 *
 * Desktop (Figma "… (Desktop)"): Page header "← Les" + "Cocokkan Tutor";
 * kandidat berjajar tiga kolom dengan tombol "Pilih Kak …" di kanan header.
 * Tidak ada kandidat: konten selebar 768px. Tersimpan: Page header tanpa
 * tautan kembali, hasil di tengah (560px), tombol berdampingan.
 */
const LES = "/pengelola/les"

function CocokkanTutor() {
  const { registrationId = "" } = useParams()
  const navigate = useNavigate()
  const query = useQuery(matchingCandidatesQuery(registrationId))
  const [chosen, setChosen] = React.useState<{
    registration: PengelolaRegistration
    candidate: Candidate
  } | null>(null)

  if (chosen) {
    return <MatchSaved {...chosen} />
  }

  if (query.data && needsTutor(query.data.registration)) {
    return <CandidatePicker data={query.data} onSaved={setChosen} />
  }

  return (
    <DetailScreen title="Cocokkan Tutor" backLabel="Les" desktopHeader="page">
      {query.isPending ? (
        <DataState state="loading" loadingLabel="Mencari kandidat tutor…" />
      ) : query.isError && !isNotFoundError(query.error) ? (
        <DataState
          state="error"
          title="Kandidat gagal dimuat"
          description={getErrorMessage(query.error)}
          action={{ label: "Coba lagi", onClick: () => query.refetch() }}
        />
      ) : (
        <DataState
          state="empty"
          title={
            query.isError
              ? "Pendaftaran tidak ditemukan"
              : query.data?.registration.match
                ? "Siswa sudah punya tutor"
                : "Pendaftaran belum terverifikasi"
          }
          description={
            query.data?.registration.match
              ? `${query.data.registration.student.name} sudah dicocokkan dengan ${query.data.registration.match.tutorName}.`
              : "Hanya siswa terverifikasi yang belum punya tutor yang bisa dicocokkan."
          }
          action={{
            label: "Kembali ke Les",
            onClick: () => navigate(LES, { replace: true }),
          }}
        />
      )}
    </DetailScreen>
  )
}

/* ---------- Pilih kandidat ---------- */

function CandidatePicker({
  data,
  onSaved,
}: {
  data: MatchingCandidates
  onSaved: (result: {
    registration: PengelolaRegistration
    candidate: Candidate
  }) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const showPartial = params.get("sebagian") === "1"
  const { registration, candidates, fullMatches } = data

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const effectiveId =
    selectedId ?? (fullMatches > 0 ? candidates[0]?.tutorId : null) ?? null
  const selected = candidates.find((c) => c.tutorId === effectiveId)

  const save = useMutation({
    mutationFn: (candidate: Candidate) =>
      selectTutor(registration.id, candidate.tutorId).then((updated) => ({
        registration: updated,
        candidate,
      })),
    networkMode: "always",
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["pencocokan"] })
      void queryClient.invalidateQueries({ queryKey: ["verifikasi"] })
      /* Muncul di "Belum dikirim" pada tab Penawaran (P4) */
      void queryClient.invalidateQueries({ queryKey: ["penawaran"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      onSaved(result)
    },
    onError: (error) => {
      if (isAlreadyProcessedError(error)) {
        toast.error("Siswa sudah punya tutor", {
          description: "Pencocokan ini sudah disimpan sebelumnya.",
        })
        void queryClient.invalidateQueries({ queryKey: ["pencocokan"] })
        navigate(LES, { replace: true })
        return
      }
      toast.error("Pilihan tutor gagal disimpan", {
        description: getErrorMessage(error),
      })
    },
  })

  if (fullMatches === 0 && !showPartial) {
    return (
      <NoCandidate
        data={data}
        onShowPartial={() => setParams({ sebagian: "1" })}
      />
    )
  }

  return (
    <DetailScreen
      title="Cocokkan Tutor"
      backLabel="Les"
      desktopHeader="page"
      desktopActions="header"
      desktopWidth="wide"
      footer={
        <Button
          onClick={() => selected && save.mutate(selected)}
          disabled={!selected || save.isPending}
        >
          {save.isPending
            ? "Menyimpan…"
            : selected
              ? `Pilih ${selected.shortName}`
              : "Pilih tutor"}
        </Button>
      }
    >
      <StudentNeeds registration={registration} />

      <div className="gap-ns-2xs flex flex-col leading-normal">
        <h2 className="text-body text-grayscale-text-title font-bold">
          {fullMatches > 0
            ? `${candidates.length} kandidat tutor aktif`
            : `${candidates.length} tutor memenuhi sebagian kriteria`}
        </h2>
        <p className="text-caption text-grayscale-text-caption">
          Diurutkan dari kecocokan tertinggi
        </p>
      </div>

      {candidates.length > 0 ? (
        <RadioGroup
          aria-label="Kandidat tutor"
          value={effectiveId}
          onValueChange={(v) => setSelectedId(v as string)}
          /* Mobile: ditumpuk; desktop: tiga kolom, gap 24 */
          className="gap-ns-l lg:grid-cols-3 lg:gap-ns-2xl"
        >
          {candidates.map((c) => (
            <TutorCandidate
              key={c.tutorId}
              value={c.tutorId}
              name={c.name}
              initials={c.initials}
              education={c.education}
              criteria={c.criteria}
              meta={`Rating ${c.rating.toLocaleString("id-ID")} · ${c.activeStudents} siswa aktif`}
              score={`Cocok ${c.score}%`}
            />
          ))}
        </RadioGroup>
      ) : (
        <DataState
          state="empty"
          title="Belum ada tutor untuk mapel ini"
          description={`Belum ada tutor aktif yang mengajar ${joinAnd(registration.needs.subjects)} ${registration.student.level}.`}
        />
      )}
    </DetailScreen>
  )
}

function StudentNeeds({
  registration: r,
}: {
  registration: PengelolaRegistration
}) {
  return (
    <section
      aria-label="Kebutuhan siswa"
      className="gap-ns-2xs border-grayscale-border-default bg-grayscale-surface-default px-ns-l py-ns-m flex flex-col rounded-(--comp-radius-md) border leading-normal"
    >
      <p className="text-subtitle text-grayscale-text-title font-bold">
        {r.student.name} · {gradeLabel(r.student)}
      </p>
      <p className="text-caption text-grayscale-text-caption">
        {r.needs.subjects.join(", ")} · {formatRequestedSchedule(r.needs)} ·{" "}
        {formatShortAddress(r.student.address)}
      </p>
    </section>
  )
}

/* ---------- Tidak ada kandidat ---------- */

function NoCandidate({
  data,
  onShowPartial,
}: {
  data: MatchingCandidates
  onShowPartial: () => void
}) {
  const { registration: r, candidates } = data

  return (
    <DetailScreen title="Cocokkan Tutor" backLabel="Les" desktopHeader="page">
      <StudentNeeds registration={r} />

      <AlertBanner
        status="warning"
        title="Belum ada tutor yang memenuhi semua kriteria"
        description={`Tidak ada tutor aktif untuk ${joinAnd(r.needs.subjects)} ${r.student.level} yang tersedia ${joinAnd(r.needs.days)} dalam radius ${MAX_DISTANCE_KM} km.`}
      />

      <section aria-labelledby="alternatif" className="gap-ns-m flex flex-col">
        <h2
          id="alternatif"
          className="text-body text-grayscale-text-title leading-normal font-bold"
        >
          Pilih alternatif penugasan
        </h2>
        <DashboardList>
          {candidates.length > 0 && (
            <ListItem
              icon={<UsersIcon />}
              title="Lihat kecocokan sebagian"
              description={`${candidates.length} tutor memenuhi sebagian kriteria`}
              chevron
              render={<button type="button" onClick={onShowPartial} />}
            />
          )}
          <ListItem
            icon={<PhoneIcon />}
            title="Hubungi wali untuk ubah jadwal"
            description="Tawarkan hari atau jam lain"
            chevron
            render={
              <a
                href={toWhatsAppUrl(r.parent.whatsapp) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          />
          <ListItem
            icon={<CircleXIcon />}
            title="Tolak pendaftaran"
            description="Beri tahu wali bahwa tutor belum tersedia"
            chevron
            render={
              <Link
                to={`/pengelola/pendaftaran/${r.id}/tolak?alasan=tutor_belum_tersedia`}
              />
            }
          />
        </DashboardList>
      </section>
    </DetailScreen>
  )
}

/* ---------- Tersimpan ---------- */

function MatchSaved({
  registration: r,
  candidate,
}: {
  registration: PengelolaRegistration
  candidate: Candidate
}) {
  const navigate = useNavigate()

  return (
    <ResultScreen
      pageTitle="Cocokkan Tutor"
      title={`${candidate.shortName} dipilih untuk ${firstName(r.student.name)}`}
      description={`Kirim penawaran agar ${candidate.shortName} bisa menerima atau menolak penugasan ini.`}
      footer={
        <>
          <Button
            size="lg"
            className={RESULT_BUTTON_DESKTOP}
            nativeButton={false}
            render={<Link to={`${LES}/penawaran/${r.id}/buat`} replace />}
          >
            Kirim Penawaran ke Tutor
          </Button>
          <Button
            variant="tertiary"
            onClick={() => navigate(LES, { replace: true })}
          >
            Nanti saja
          </Button>
        </>
      }
    >
      <Card size="compact" className="w-full">
        <CardHeader>
          <CardTitle>Ringkasan pencocokan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="gap-ns-m flex flex-col">
            <SummaryRow label="Siswa" align="between">
              {r.student.name} · {r.student.grade} {r.student.level}
            </SummaryRow>
            <SummaryRow label="Tutor" align="between">
              {candidate.name}
            </SummaryRow>
            <SummaryRow label="Mata pelajaran" align="between">
              {r.needs.subjects.join(", ")}
            </SummaryRow>
            <SummaryRow label="Jadwal diminta" align="between">
              {formatRequestedSchedule(r.needs)}
            </SummaryRow>
            <SummaryRow label="Penawaran" align="between">
              Belum dikirim
            </SummaryRow>
          </dl>
        </CardContent>
      </Card>
    </ResultScreen>
  )
}

export { CocokkanTutor }
