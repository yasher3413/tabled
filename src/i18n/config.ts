export const LOCALES = ["en", "fr"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "en"

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** English lives at the root ("/bills"); French under "/fr" ("/fr/bills"). */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

/** Strip a locale prefix: "/fr/bills" -> "/bills". */
export function unlocalizedPath(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/"
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1)
  }
  return pathname
}

export const INTL_LOCALE: Record<Locale, string> = { en: "en-CA", fr: "fr-CA" }
