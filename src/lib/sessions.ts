import type { Locale } from "@/i18n/config"

function ordinalEn(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

/** "45th Parliament, 1st session" / "1re session de la 45e législature" */
export function sessionLabel(s: { parliament: number; session: number }, locale: Locale): string {
  if (locale === "fr") return `${s.session === 1 ? "1re" : `${s.session}e`} session de la ${s.parliament}e législature`
  return `${ordinalEn(s.parliament)} Parliament, ${ordinalEn(s.session)} session`
}
