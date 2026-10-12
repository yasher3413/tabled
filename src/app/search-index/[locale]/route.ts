import { isLocale, localePath, LOCALES, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatShortDate } from "@/lib/format"
import { getDataYear, listBills, listMembers, listVotes, partyMap } from "@/lib/queries"

export interface SearchEntry {
  /** b = bill, m = MP, v = vote */
  k: "b" | "m" | "v"
  label: string
  sub: string
  href: string
  /** Extra words to match on. */
  kw: string
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : "en"
  const t = getMessages(locale)
  const parties = partyMap()
  const year = getDataYear()
  const fr = locale === "fr"
  const entries: SearchEntry[] = [
    ...listBills()
      .sort((a, b) => (b.lastActivityDate ?? "").localeCompare(a.lastActivityDate ?? ""))
      .map((b) => {
        const short = fr ? (b.shortTitleFr ?? b.shortTitle) : b.shortTitle
        const long = fr ? (b.titleFr ?? b.title) : b.title
        return {
          k: "b" as const,
          label: `${b.number} ${short ?? long}`,
          sub: short ? long : t.bills.typeLabels[b.type],
          href: localePath(locale, `/bills/${b.sessionId}/${b.number}`),
          // Match both languages so a search works whichever words people know.
          kw: [b.number.replace("-", ""), b.sponsorName ?? "", b.title, b.titleFr ?? "", b.shortTitle ?? "", b.shortTitleFr ?? ""].join(" "),
        }
      }),
    ...listMembers()
      .sort((a, b) => Number(b.active) - Number(a.active))
      .map((m) => ({
        k: "m" as const,
        label: m.name,
        sub: [m.partyId ? (fr ? (parties.get(m.partyId)?.nameFr ?? parties.get(m.partyId)?.shortName) : parties.get(m.partyId)?.shortName) : null, m.ridingName]
          .filter(Boolean)
          .join(" · "),
        href: localePath(locale, `/mps/${m.id}`),
        kw: [m.ridingName ?? "", m.province ?? ""].join(" "),
      })),
    ...listVotes().map((v) => ({
      k: "v" as const,
      label: fr ? `${t.home.voteN(v.number)} : ${v.descriptionFr ?? v.descriptionEn}` : `${t.home.voteN(v.number)}: ${v.descriptionEn}`,
      sub: `${formatShortDate(v.date, year, locale)} · ${t.vote[v.result]} ${v.yeas} ${t.vote.to} ${v.nays}`,
      href: localePath(locale, `/votes/${v.sessionId}/${v.number}`),
      kw: `${v.billNumber ?? ""} ${v.descriptionEn} ${v.descriptionFr ?? ""}`,
    })),
  ]
  return Response.json(entries)
}
