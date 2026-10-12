import type { Locale } from "./config"

const SHORT_FR: Record<string, string> = {
  liberal: "Libéral",
  conservative: "Conservateur",
  bloc: "Bloc",
  ndp: "NPD",
  green: "Vert",
  independent: "Indépendant",
}

/** Short party label for tags and tables: "Liberal" / "Libéral", "NDP" / "NPD". */
export function partyShort(party: { id: string; shortName: string } | undefined | null, locale: Locale): string {
  if (!party) return locale === "fr" ? "Aucun parti" : "No party"
  return locale === "fr" ? (SHORT_FR[party.id] ?? party.shortName) : party.shortName
}

/** Full party name: "Liberal Party of Canada" / "Parti libéral du Canada". */
export function partyName(party: { nameEn: string; nameFr: string | null } | undefined | null, locale: Locale): string {
  if (!party) return locale === "fr" ? "Aucun parti" : "No party"
  return locale === "fr" ? (party.nameFr ?? party.nameEn) : party.nameEn
}
