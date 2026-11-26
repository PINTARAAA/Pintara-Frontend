import { useFormContext } from "react-hook-form"

import { Card, CardContent, CardHeader, CardTitle } from "@/components"
import { SummaryRow } from "@/features/pendaftaran/components/form-group"
import {
  FREQUENCY_OPTIONS,
  SESSION_MINUTES,
  type PendaftaranInput,
} from "@/features/pendaftaran/schemas"

/* Langkah 4 · Ringkasan: kartu Compact per bagian, baris label/nilai */
function StepRingkasan({ showIntro = true }: { showIntro?: boolean }) {
  const values = useFormContext<PendaftaranInput>().getValues()
  const frequency = FREQUENCY_OPTIONS.find((f) => f.value === values.frequency)

  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: "Data Wali",
      rows: [
        ["Nama wali", values.parentName],
        ["No. WhatsApp", values.parentPhone],
      ],
    },
    {
      title: "Data Siswa",
      rows: [
        ["Nama siswa", values.studentName],
        ["Kelas", values.grade],
        ["Sekolah", values.school],
        ["Alamat les", values.address],
      ],
    },
    {
      title: "Kebutuhan Belajar",
      rows: [
        ["Mata pelajaran", values.subjects.join(", ")],
        ["Frekuensi", frequency?.label ?? "-"],
        ["Catatan", values.notes.trim() || "-"],
      ],
    },
    {
      title: "Jadwal Belajar",
      rows: [
        ["Hari", values.days.join(", ")],
        ["Jam mulai", `${values.startTime} (${SESSION_MINUTES} menit)`],
      ],
    },
  ]

  return (
    <>
      {showIntro && (
        <p className="text-subtitle leading-normal text-grayscale-text-body">
          Periksa kembali data pendaftaran sebelum dikirim.
        </p>
      )}
      {sections.map((section) => (
        <Card key={section.title} size="compact">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-ns-m">
              {section.rows.map(([label, value]) => (
                <SummaryRow key={label} label={label}>
                  {value}
                </SummaryRow>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

export { StepRingkasan }
