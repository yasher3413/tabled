const dateFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
const shortFmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" })
const shortYearFmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

function parse(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`)
}

/** "October 8, 2026" */
export function formatDate(date: string | null | undefined): string {
  return date ? dateFmt.format(parse(date)) : "Date unavailable"
}

/** "Oct 8" when in the reference year, else "Oct 8, 2025". Pass the data year; no clock reads, so pages prerender. */
export function formatShortDate(date: string | null | undefined, referenceYear?: number): string {
  if (!date) return "No date"
  const d = parse(date)
  return d.getUTCFullYear() === referenceYear ? shortFmt.format(d) : shortYearFmt.format(d)
}

export function formatPercent(rate: number | null | undefined, digits = 1): string {
  if (rate === null || rate === undefined) return "n/a"
  const pct = rate * 100
  // Never round 99.95 up to 100 when it is not 100.
  const fixed = pct.toFixed(digits)
  return `${Number(fixed) === 100 && pct < 100 ? (100 - 10 ** -digits).toFixed(digits) : fixed}%`
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-CA")
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s'-]/gu, "").trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export const PROVINCES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
}

export function provinceName(code: string | null | undefined): string {
  return code ? (PROVINCES[code] ?? code) : "Unknown"
}
