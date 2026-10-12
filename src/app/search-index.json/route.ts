import { getDataYear, listBills, listMembers, listVotes, partyMap } from "@/lib/queries"
import { formatShortDate } from "@/lib/format"

export interface SearchEntry {
  /** b = bill, m = MP, v = vote */
  k: "b" | "m" | "v"
  label: string
  sub: string
  href: string
  /** Extra words to match on. */
  kw: string
}

export function GET() {
  const parties = partyMap()
  const year = getDataYear()
  const entries: SearchEntry[] = [
    ...listBills()
      .sort((a, b) => (b.lastActivityDate ?? "").localeCompare(a.lastActivityDate ?? ""))
      .map((b) => ({
        k: "b" as const,
        label: `${b.number} ${b.shortTitle ?? b.title}`,
        sub: b.shortTitle ? b.title : b.typeLabel,
        href: `/bills/${b.sessionId}/${b.number}`,
        kw: [b.number.replace("-", ""), b.sponsorName ?? "", b.typeLabel].join(" "),
      })),
    ...listMembers()
      .sort((a, b) => Number(b.active) - Number(a.active))
      .map((m) => ({
        k: "m" as const,
        label: m.name,
        sub: [m.partyId ? parties.get(m.partyId)?.shortName : null, m.ridingName, m.active ? null : "former MP"]
          .filter(Boolean)
          .join(" · "),
        href: `/mps/${m.id}`,
        kw: [m.ridingName ?? "", m.province ?? ""].join(" "),
      })),
    ...listVotes().map((v) => ({
      k: "v" as const,
      label: `Vote ${v.number}: ${v.descriptionEn}`,
      sub: `${formatShortDate(v.date, year)} · ${v.result === "passed" ? "Passed" : v.result === "failed" ? "Failed" : "Tied"} ${v.yeas} to ${v.nays}`,
      href: `/votes/${v.sessionId}/${v.number}`,
      kw: v.billNumber ?? "",
    })),
  ]
  return Response.json(entries)
}
