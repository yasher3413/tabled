import type { OPMembership, OPPolitician } from "../types"

/** Static reference names for federal parties; the API only exposes English names. */
const PARTY_META: Record<string, { nameEn: string; nameFr: string; color: string }> = {
  liberal: { nameEn: "Liberal Party of Canada", nameFr: "Parti libéral du Canada", color: "party-liberal" },
  conservative: {
    nameEn: "Conservative Party of Canada",
    nameFr: "Parti conservateur du Canada",
    color: "party-conservative",
  },
  bloc: { nameEn: "Bloc Québécois", nameFr: "Bloc Québécois", color: "party-bloc" },
  ndp: { nameEn: "New Democratic Party", nameFr: "Nouveau Parti démocratique", color: "party-ndp" },
  green: { nameEn: "Green Party of Canada", nameFr: "Parti vert du Canada", color: "party-green" },
  independent: { nameEn: "Independent", nameFr: "Indépendant", color: "party-independent" },
}

export function slugFromUrl(url: string): string {
  const parts = url.split("/").filter(Boolean)
  return parts[parts.length - 1]
}

export function partyIdFromShortName(shortName: string): string {
  const s = shortName.trim().toLowerCase()
  if (s.startsWith("bloc")) return "bloc"
  if (s.startsWith("green")) return "green"
  if (s === "new democratic party") return "ndp"
  if (s.startsWith("ind")) return "independent"
  return s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function partyRow(shortName: string, fullName?: string) {
  const id = partyIdFromShortName(shortName)
  const meta = PARTY_META[id]
  return {
    id,
    shortName: id === "ndp" ? "NDP" : shortName,
    nameEn: meta?.nameEn ?? fullName ?? shortName,
    nameFr: meta?.nameFr ?? null,
    colorToken: meta?.color ?? "party-other",
  }
}

export interface NormalizedMember {
  member: {
    id: string
    openparliamentUrl: string
    parlMpId: number | null
    name: string
    givenName: string | null
    familyName: string | null
    partyId: string | null
    ridingId: string | null
    province: string | null
    photoUrl: null
    active: boolean
    startDate: string | null
    endDate: string | null
    ourcommonsUrl: string | null
  }
  memberships: {
    url: string
    memberId: string
    partyId: string | null
    ridingId: string | null
    startDate: string | null
    endDate: string | null
  }[]
  parties: ReturnType<typeof partyRow>[]
  ridings: { id: string; nameEn: string; nameFr: string | null; province: string }[]
}

/** Membership spans that overlap the session window (inclusive dates as ISO strings). */
export function overlaps(m: Pick<OPMembership, "start_date" | "end_date">, from: string, to: string) {
  const start = m.start_date ?? "0000-00-00"
  const end = m.end_date ?? "9999-12-31"
  return start <= to && end >= from
}

export function normalizePolitician(
  p: OPPolitician,
  sessionStart: string,
  today: string,
): NormalizedMember {
  const id = slugFromUrl(p.url)
  const relevant = p.memberships.filter((m) => overlaps(m, sessionStart, today))
  // Latest membership in the session window describes the member's current party and riding.
  const sorted = [...relevant].sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))
  const latest = sorted[sorted.length - 1] ?? null
  const parties = relevant
    .filter((m) => m.party)
    .map((m) => partyRow(m.party!.short_name.en, m.party!.name.en))
  const ridings = relevant
    .filter((m) => m.riding)
    .map((m) => ({
      id: String(m.riding!.id),
      nameEn: m.riding!.name.en,
      nameFr: m.riding!.name.fr ?? null,
      province: m.riding!.province,
    }))
  const parlMpId = Number(p.other_info?.parl_mp_id?.[0])
  return {
    member: {
      id,
      openparliamentUrl: p.url,
      parlMpId: Number.isFinite(parlMpId) ? parlMpId : null,
      name: p.name,
      givenName: p.given_name ?? null,
      familyName: p.family_name ?? null,
      partyId: latest?.party ? partyIdFromShortName(latest.party.short_name.en) : null,
      ridingId: latest?.riding ? String(latest.riding.id) : null,
      province: latest?.riding?.province ?? null,
      photoUrl: null,
      active: latest ? latest.end_date === null : false,
      startDate: sorted[0]?.start_date ?? null,
      endDate: latest?.end_date ?? null,
      ourcommonsUrl: p.links?.find((l) => l.url.includes("ourcommons.ca"))?.url ?? null,
    },
    // Only memberships inside the session window, so every party and riding referenced is stored.
    memberships: relevant.map((m) => ({
      url: m.url,
      memberId: id,
      partyId: m.party ? partyIdFromShortName(m.party.short_name.en) : null,
      ridingId: m.riding ? String(m.riding.id) : null,
      startDate: m.start_date,
      endDate: m.end_date,
    })),
    parties,
    ridings,
  }
}
