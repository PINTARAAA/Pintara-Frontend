import * as React from "react"

import { Input } from "@/components/ui/input"
import { formatPhoneInput } from "@/lib/format"

/*
 * PhoneInput · Input untuk No. WhatsApp yang terformat otomatis selagi
 * diketik: "081234567890" → "0812-3456-7890" (lihat formatPhoneInput).
 *
 * Bisa dipakai langsung dengan react-hook-form: {...register("phone")}.
 * Nilai di elemen sudah diformat sebelum onChange milik pemanggil
 * dijalankan, dan posisi kursor dijaga (tidak meloncat ke akhir saat
 * mengedit di tengah nomor).
 */
function PhoneInput({
  onChange,
  placeholder = "Contoh: 0812-3456-7890",
  ...props
}: React.ComponentProps<typeof Input>) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const raw = input.value
    const formatted = formatPhoneInput(raw)

    if (formatted !== raw) {
      /* Jumlah digit di kiri kursor sebelum diformat */
      const caret = input.selectionStart ?? raw.length
      const digitsBefore = raw.slice(0, caret).replace(/\D/g, "").length
      /* Awalan 62/8 yang diubah ke 0 menggeser hitungan digit */
      const shift =
        formatted.replace(/\D/g, "").length - raw.replace(/\D/g, "").length

      input.value = formatted

      let position = formatted.length
      let seen = 0
      const target = Math.max(0, digitsBefore + Math.max(0, shift))
      for (let i = 0; i < formatted.length; i++) {
        if (seen === target) {
          position = i
          break
        }
        if (/\d/.test(formatted[i])) seen++
      }
      input.setSelectionRange(position, position)
    }

    onChange?.(event)
  }

  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder={placeholder}
      /* Tanpa maxLength: tempelan "+62 812 3456 7890" harus utuh dulu
         sebelum diformat; formatPhoneInput sudah membatasi 13 digit */
      onChange={handleChange}
      {...props}
    />
  )
}

export { PhoneInput }
