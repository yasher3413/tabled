import { INTL_LOCALE, type Locale } from "@/i18n/config"

const cache = new Map<string, Intl.DateTimeFormat>()
function fmt(locale: Locale, opts: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(opts)}`
  let f = cache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...opts, timeZone: "UTC" })
    cache.set(key, f)
  }
  return f
}

function parse(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`)
}

/** "October 8, 2026" / "8 octobre 2026" */
export function formatDate(date: string | null | undefined, locale: Locale = "en"): string {
  if (!date) return locale === "fr" ? "Date inconnue" : "Date unavailable"
  return fmt(locale, { year: "numeric", month: "long", day: "numeric" }).format(parse(date))
}

/** "Oct 8" when in the reference year, else "Oct 8, 2025". Pass the data year; no clock reads, so pages prerender. */
export function formatShortDate(date: string | null | undefined, referenceYear?: number, locale: Locale = "en"): string {
  if (!date) return locale === "fr" ? "Sans date" : "No date"
  const d = parse(date)
  const sameYear = d.getUTCFullYear() === referenceYear
  return fmt(locale, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }).format(d)
}

/** "99.4%" / "99,4 %". Never rounds a rate below 1 up to 100. */
export function formatPercent(rate: number | null | undefined, digits = 1, locale: Locale = "en"): string {
  if (rate === null || rate === undefined) return locale === "fr" ? "s.o." : "n/a"
  const pct = rate * 100
  let value = Number(pct.toFixed(digits))
  if (value === 100 && pct < 100) value = 100 - 10 ** -digits
  const n = value.toLocaleString(INTL_LOCALE[locale], { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return locale === "fr" ? `${n} %` : `${n}%`
}

export function formatNumber(n: number, locale: Locale = "en"): string {
  return n.toLocaleString(INTL_LOCALE[locale])
}

export function plural(n: number, one: string, many = `${one}s`, locale: Locale = "en"): string {
  return `${formatNumber(n, locale)} ${n === 1 ? one : many}`
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

export const PROVINCES_FR: Record<string, string> = {
  AB: "Alberta",
  BC: "Colombie-Britannique",
  MB: "Manitoba",
  NB: "Nouveau-Brunswick",
  NL: "Terre-Neuve-et-Labrador",
  NS: "Nouvelle-Écosse",
  NT: "Territoires du Nord-Ouest",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Île-du-Prince-Édouard",
  QC: "Québec",
  SK: "Saskatchewan",
  YT: "Yukon",
}

export function provinces(locale: Locale = "en") {
  return locale === "fr" ? PROVINCES_FR : PROVINCES
}

export function provinceName(code: string | null | undefined, locale: Locale = "en"): string {
  if (!code) return locale === "fr" ? "Inconnue" : "Unknown"
  return provinces(locale)[code] ?? code
}
