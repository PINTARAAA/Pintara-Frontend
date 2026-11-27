const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/

export function reviveDates<T>(value: T): T {
  if (typeof value === "string") {
    if (!ISO_DATE_TIME.test(value)) return value
    const date = new Date(value)
    return (Number.isNaN(date.getTime()) ? value : date) as T
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = reviveDates(value[i])
    return value
  }

  if (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record)) {
      record[key] = reviveDates(record[key])
    }
  }

  return value
}
