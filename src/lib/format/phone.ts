const NATIONAL = /^8\d{8,11}$/

function nationalPart(input: string): string | null {
  let digits = input.replace(/\D/g, "")
  if (digits.startsWith("62")) digits = digits.slice(2)
  else if (digits.startsWith("0")) digits = digits.slice(1)
  return NATIONAL.test(digits) ? digits : null
}

export function normalizePhone(input: string): string | null {
  const national = nationalPart(input)
  return national && `62${national}`
}

export function isValidPhone(input: string): boolean {
  return nationalPart(input) !== null
}

export function formatPhone(
  input: string,
  style: "local" | "international" = "local"
): string {
  const national = nationalPart(input)
  if (!national) return input.trim()

  if (style === "international") {
    const groups = [
      national.slice(0, 3),
      national.slice(3, 7),
      national.slice(7),
    ]
    return `+62 ${groups.filter(Boolean).join("-")}`
  }

  const local = `0${national}`
  const groups = [local.slice(0, 4), local.slice(4, 8), local.slice(8)]
  return groups.filter(Boolean).join("-")
}

export function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("62")) digits = `0${digits.slice(2)}`
  else if (digits.startsWith("8")) digits = `0${digits}`
  digits = digits.slice(0, 13)
  return [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8)]
    .filter(Boolean)
    .join("-")
}

export function toWhatsAppUrl(input: string, message?: string): string | null {
  const number = normalizePhone(input)
  if (!number) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${number}${text}`
}
